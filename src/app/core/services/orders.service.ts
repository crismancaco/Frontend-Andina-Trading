import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

export interface Orden {
  id_orden: number;
  id_usuario: string;
  id_accion: string; // Símbolo de la acción (ECOPETROL, BANCOLOMBIA, etc.)
  tipo: 'compra' | 'venta';
  cantidad: number;
  precio: number; // Precio por unidad al momento de la orden
  estado: 'pendiente' | 'completada' | 'cancelada';
  fecha_orden: string; // ISO string del timestamp
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly ORDERS_KEY = 'andina_trading_ordenes';
  private orderIdCounter = 1;

  constructor(private storageService: StorageService) {
    // Inicializar contador basado en órdenes existentes
    this.initializeCounter();
  }

  /**
   * Inicializa el contador de IDs basado en las órdenes existentes
   */
  private initializeCounter(): void {
    const orders = this.getOrders();
    if (orders.length > 0) {
      const maxId = Math.max(...orders.map(o => o.id_orden));
      this.orderIdCounter = maxId + 1;
    }
  }

  /**
   * Crea una nueva orden
   */
  createOrder(
    id_usuario: string,
    id_accion: string,
    tipo: 'compra' | 'venta',
    cantidad: number,
    precio: number
  ): Orden {
    const nuevaOrden: Orden = {
      id_orden: this.orderIdCounter++,
      id_usuario,
      id_accion,
      tipo,
      cantidad,
      precio,
      estado: 'completada', // Por defecto completada (simulación)
      fecha_orden: new Date().toISOString()
    };

    const orders = this.getOrders();
    orders.push(nuevaOrden);
    this.saveOrders(orders);

    return nuevaOrden;
  }

  /**
   * Obtiene todas las órdenes
   */
  getOrders(): Orden[] {
    return this.storageService.getItem<Orden[]>(this.ORDERS_KEY) || [];
  }

  /**
   * Obtiene las órdenes de un usuario específico
   */
  getOrdersByUser(id_usuario: string): Orden[] {
    return this.getOrders().filter(order => order.id_usuario === id_usuario);
  }

  /**
   * Obtiene las órdenes de una acción específica
   */
  getOrdersByStock(id_accion: string): Orden[] {
    return this.getOrders().filter(order => order.id_accion === id_accion);
  }

  /**
   * Obtiene las órdenes de compra completadas de un usuario (sus acciones compradas)
   */
  getPurchasedStocks(id_usuario: string): Orden[] {
    return this.getOrdersByUser(id_usuario).filter(
      order => order.tipo === 'compra' && order.estado === 'completada'
    );
  }

  /**
   * Calcula la cantidad total de una acción que tiene un usuario
   */
  getStockQuantity(id_usuario: string, id_accion: string): number {
    const userOrders = this.getOrdersByUser(id_usuario).filter(
      o => o.id_accion === id_accion && o.estado === 'completada'
    );

    let total = 0;
    userOrders.forEach(order => {
      if (order.tipo === 'compra') {
        total += order.cantidad;
      } else if (order.tipo === 'venta') {
        total -= order.cantidad;
      }
    });

    return Math.max(0, total); // No puede ser negativo
  }

  /**
   * Obtiene todas las acciones únicas que el usuario ha comprado
   */
  getUniquePurchasedStocks(id_usuario: string): string[] {
    const purchasedOrders = this.getPurchasedStocks(id_usuario);
    const uniqueStocks = new Set<string>();
    
    purchasedOrders.forEach(order => {
      if (this.getStockQuantity(id_usuario, order.id_accion) > 0) {
        uniqueStocks.add(order.id_accion);
      }
    });

    return Array.from(uniqueStocks);
  }

  /**
   * Guarda las órdenes en localStorage
   */
  private saveOrders(orders: Orden[]): void {
    this.storageService.setItem(this.ORDERS_KEY, orders);
  }

  /**
   * Actualiza el estado de una orden
   */
  updateOrderStatus(id_orden: number, nuevoEstado: 'pendiente' | 'completada' | 'cancelada'): boolean {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id_orden === id_orden);

    if (orderIndex === -1) {
      return false;
    }

    orders[orderIndex].estado = nuevoEstado;
    this.saveOrders(orders);
    return true;
  }

  /**
   * Elimina una orden
   */
  deleteOrder(id_orden: number): boolean {
    const orders = this.getOrders();
    const filteredOrders = orders.filter(o => o.id_orden !== id_orden);
    
    if (filteredOrders.length === orders.length) {
      return false; // No se encontró la orden
    }

    this.saveOrders(filteredOrders);
    return true;
  }
}

