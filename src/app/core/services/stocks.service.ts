import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { AuditService } from './audit.service';

export interface Stock {
  symbol: string;
  name: string;
  country: 'Colombia' | 'Ecuador' | 'Perú';
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

@Injectable({
  providedIn: 'root'
})
export class StocksService {
  private readonly STOCKS_KEY = 'andina_trading_stocks';

  // Stocks iniciales por defecto
  private readonly DEFAULT_STOCKS: Stock[] = [
    // Colombia - BVC
    { symbol: 'ECOPETROL', name: 'Ecopetrol S.A.', country: 'Colombia', price: 2450.50, change: 25.30, changePercent: 1.04, volume: 1250000 },
    { symbol: 'GRUPO_SURA', name: 'Grupo de Inversiones Sura', country: 'Colombia', price: 18200.00, change: -150.00, changePercent: -0.82, volume: 850000 },
    { symbol: 'BANCOLOMBIA', name: 'Bancolombia S.A.', country: 'Colombia', price: 32450.00, change: 520.00, changePercent: 1.63, volume: 2100000 },
    { symbol: 'GRUPO_AVAL', name: 'Grupo Aval Acciones y Valores', country: 'Colombia', price: 980.00, change: 15.50, changePercent: 1.61, volume: 1850000 },
    { symbol: 'CEMARGOS', name: 'Cementos Argos S.A.', country: 'Colombia', price: 8920.00, change: -120.00, changePercent: -1.33, volume: 650000 },
    { symbol: 'EXITO', name: 'Grupo Éxito', country: 'Colombia', price: 3450.00, change: 45.00, changePercent: 1.32, volume: 420000 },
    { symbol: 'NUTRESA', name: 'Grupo Nutresa', country: 'Colombia', price: 45600.00, change: 380.00, changePercent: 0.84, volume: 320000 },
    { symbol: 'ISA', name: 'Interconexión Eléctrica S.A.', country: 'Colombia', price: 12500.00, change: 180.00, changePercent: 1.46, volume: 580000 },
    
    // Ecuador
    { symbol: 'BANCO_PICHINCHA', name: 'Banco Pichincha', country: 'Ecuador', price: 45.80, change: 0.65, changePercent: 1.44, volume: 850000 },
    { symbol: 'BANCO_GUAYAQUIL', name: 'Banco de Guayaquil', country: 'Ecuador', price: 52.30, change: -0.45, changePercent: -0.85, volume: 420000 },
    { symbol: 'PRODUBANCO', name: 'Produbanco', country: 'Ecuador', price: 38.90, change: 0.30, changePercent: 0.78, volume: 280000 },
    { symbol: 'BANCO_BOLIVARIANO', name: 'Banco Bolivariano', country: 'Ecuador', price: 41.20, change: 0.25, changePercent: 0.61, volume: 190000 },
    { symbol: 'BANCO_INTERNACIONAL', name: 'Banco Internacional', country: 'Ecuador', price: 35.60, change: -0.20, changePercent: -0.56, volume: 150000 },
    
    // Perú - BVL
    { symbol: 'CREDICORP', name: 'Credicorp Ltd.', country: 'Perú', price: 145.80, change: 2.30, changePercent: 1.60, volume: 980000 },
    { symbol: 'SOUTHERN', name: 'Southern Copper Corporation', country: 'Perú', price: 68.50, change: -0.75, changePercent: -1.08, volume: 1250000 },
    { symbol: 'CEMENTOS_LIMA', name: 'Cementos Lima S.A.A.', country: 'Perú', price: 12.40, change: 0.15, changePercent: 1.22, volume: 850000 },
    { symbol: 'ALICORP', name: 'Alicorp S.A.A.', country: 'Perú', price: 8.90, change: 0.10, changePercent: 1.14, volume: 650000 },
    { symbol: 'BBVA', name: 'BBVA Perú', country: 'Perú', price: 2.85, change: 0.03, changePercent: 1.06, volume: 2100000 },
    { symbol: 'INTERCORP', name: 'Intercorp Financial Services', country: 'Perú', price: 42.30, change: 0.65, changePercent: 1.56, volume: 780000 },
    { symbol: 'BACKUS', name: 'Unión de Cervecerías Peruanas Backus', country: 'Perú', price: 18.50, change: -0.20, changePercent: -1.07, volume: 520000 },
    { symbol: 'VOLCAN', name: 'Compañía Minera Volcan', country: 'Perú', price: 6.80, change: 0.05, changePercent: 0.74, volume: 950000 }
  ];

  constructor(
    private storageService: StorageService,
    private auditService: AuditService
  ) {
    // Inicializar stocks si no existen
    this.initializeStocks();
  }

  /**
   * Inicializa los stocks con los valores por defecto si no existen
   */
  private initializeStocks(): void {
    const existingStocks = this.storageService.getItem<Stock[]>(this.STOCKS_KEY);
    if (!existingStocks || existingStocks.length === 0) {
      this.storageService.setItem(this.STOCKS_KEY, this.DEFAULT_STOCKS);
    }
  }

  /**
   * Obtiene todas las acciones
   */
  getStocks(): Stock[] {
    return this.storageService.getItem<Stock[]>(this.STOCKS_KEY) || this.DEFAULT_STOCKS;
  }

  /**
   * Obtiene una acción por su símbolo
   */
  getStockBySymbol(symbol: string): Stock | null {
    const stocks = this.getStocks();
    return stocks.find(s => s.symbol === symbol) || null;
  }

  /**
   * Crea una nueva acción
   */
  createStock(stock: Stock): boolean {
    try {
      const stocks = this.getStocks();
      
      // Verificar si ya existe una acción con el mismo símbolo
      if (stocks.some(s => s.symbol === stock.symbol)) {
        // Registrar intento fallido en auditoría
        this.auditService.log(
          'CREAR_ACCION_ERROR',
          `Intento fallido de crear acción: ${stock.symbol} - ${stock.name}. El símbolo ya existe.`
        );
        return false;
      }

      stocks.push(stock);
      this.storageService.setItem(this.STOCKS_KEY, stocks);
      
      // Registrar en auditoría con detalles completos
      this.auditService.log(
        'CREAR_ACCION',
        `Acción creada: ${stock.symbol} - ${stock.name} (${stock.country}) | Precio: $${stock.price.toFixed(2)} | Cambio: $${stock.change.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%) | Volumen: ${stock.volume.toLocaleString('es-ES')}`
      );
      
      return true;
    } catch (error) {
      console.error('Error al crear acción:', error);
      // Registrar error en auditoría
      this.auditService.log(
        'CREAR_ACCION_ERROR',
        `Error al crear acción: ${stock.symbol} - ${stock.name}. Error: ${error}`
      );
      return false;
    }
  }

  /**
   * Actualiza una acción existente
   */
  updateStock(symbol: string, updatedStock: Stock): boolean {
    try {
      const stocks = this.getStocks();
      const index = stocks.findIndex(s => s.symbol === symbol);
      
      if (index === -1) {
        // Registrar intento fallido en auditoría
        this.auditService.log(
          'ACTUALIZAR_ACCION_ERROR',
          `Intento fallido de actualizar acción: ${symbol}. La acción no existe.`
        );
        return false;
      }

      const oldStock = stocks[index];
      
      // Construir mensaje detallado de cambios
      const cambios: string[] = [];
      if (oldStock.name !== updatedStock.name) {
        cambios.push(`Nombre: "${oldStock.name}" → "${updatedStock.name}"`);
      }
      if (oldStock.country !== updatedStock.country) {
        cambios.push(`País: ${oldStock.country} → ${updatedStock.country}`);
      }
      if (oldStock.price !== updatedStock.price) {
        cambios.push(`Precio: $${oldStock.price.toFixed(2)} → $${updatedStock.price.toFixed(2)}`);
      }
      if (oldStock.change !== updatedStock.change) {
        cambios.push(`Cambio: $${oldStock.change.toFixed(2)} → $${updatedStock.change.toFixed(2)}`);
      }
      if (oldStock.changePercent !== updatedStock.changePercent) {
        cambios.push(`% Cambio: ${oldStock.changePercent >= 0 ? '+' : ''}${oldStock.changePercent.toFixed(2)}% → ${updatedStock.changePercent >= 0 ? '+' : ''}${updatedStock.changePercent.toFixed(2)}%`);
      }
      if (oldStock.volume !== updatedStock.volume) {
        cambios.push(`Volumen: ${oldStock.volume.toLocaleString('es-ES')} → ${updatedStock.volume.toLocaleString('es-ES')}`);
      }
      
      stocks[index] = updatedStock;
      this.storageService.setItem(this.STOCKS_KEY, stocks);
      
      // Registrar en auditoría con todos los cambios
      const detallesCambios = cambios.length > 0 ? cambios.join(' | ') : 'Sin cambios detectados';
      this.auditService.log(
        'ACTUALIZAR_ACCION',
        `Acción actualizada: ${updatedStock.symbol} - ${updatedStock.name} | Cambios: ${detallesCambios}`
      );
      
      return true;
    } catch (error) {
      console.error('Error al actualizar acción:', error);
      // Registrar error en auditoría
      this.auditService.log(
        'ACTUALIZAR_ACCION_ERROR',
        `Error al actualizar acción: ${symbol}. Error: ${error}`
      );
      return false;
    }
  }

  /**
   * Elimina una acción
   */
  deleteStock(symbol: string): boolean {
    try {
      const stocks = this.getStocks();
      const stock = stocks.find(s => s.symbol === symbol);
      
      if (!stock) {
        // Registrar intento fallido en auditoría
        this.auditService.log(
          'ELIMINAR_ACCION_ERROR',
          `Intento fallido de eliminar acción: ${symbol}. La acción no existe.`
        );
        return false;
      }

      // Guardar información antes de eliminar para el log
      const stockInfo = `${stock.symbol} - ${stock.name} (${stock.country}) | Precio: $${stock.price.toFixed(2)} | Volumen: ${stock.volume.toLocaleString('es-ES')}`;

      const filteredStocks = stocks.filter(s => s.symbol !== symbol);
      this.storageService.setItem(this.STOCKS_KEY, filteredStocks);
      
      // Registrar en auditoría con información completa
      this.auditService.log(
        'ELIMINAR_ACCION',
        `Acción eliminada: ${stockInfo}`
      );
      
      return true;
    } catch (error) {
      console.error('Error al eliminar acción:', error);
      // Registrar error en auditoría
      this.auditService.log(
        'ELIMINAR_ACCION_ERROR',
        `Error al eliminar acción: ${symbol}. Error: ${error}`
      );
      return false;
    }
  }

  /**
   * Filtra acciones por país
   */
  getStocksByCountry(country: 'Colombia' | 'Ecuador' | 'Perú' | 'all'): Stock[] {
    const stocks = this.getStocks();
    if (country === 'all') {
      return stocks;
    }
    return stocks.filter(s => s.country === country);
  }
}

