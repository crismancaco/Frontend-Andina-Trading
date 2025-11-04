import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Title,
  Tooltip
} from 'chart.js';
import { AuthService } from '../core/services/auth.service';
import { User, StorageService } from '../core/services/storage.service';
import { OrdersService, Orden } from '../core/services/orders.service';
import { ContractsService, Contrato } from '../core/services/contracts.service';
import { RecommendationsService, Recomendacion } from '../core/services/recommendations.service';
import { jsPDF } from 'jspdf';

interface Stock {
  symbol: string;
  name: string;
  country: 'Colombia' | 'Ecuador' | 'Perú';
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

// Registrar componentes de Chart.js
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Title,
  Tooltip
);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatListModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;

  currentUser: User | null = null;
  isComisionista: boolean = false;
  
  // Datos para comisionista
  contracts: Contrato[] = [];
  displayedColumns: string[] = ['id', 'fecha', 'inversionista', 'accion', 'cantidad', 'total', 'acciones'];
  contractDetailsMap: Map<number, any> = new Map();
  
  // Recomendaciones para accionistas
  recomendaciones: Recomendacion[] = [];
  mostrarRecomendaciones: boolean = false;
  
  // Recomendaciones creadas por el comisionista
  recomendacionesCreadas: Recomendacion[] = [];
  selectedTabIndex: number = 0;

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    // Si cambia a la pestaña de recomendaciones, inicializar el gráfico
    if (index === 1) {
      // Esperar a que el DOM se actualice
      setTimeout(() => {
        if (this.lineChartCanvas && this.lineChartCanvas.nativeElement) {
          // Destruir gráfico anterior si existe
          if (this.lineChart) {
            this.lineChart.destroy();
            this.lineChart = undefined;
          }
          this.initLineChart();
          if (this.selectedStock) {
            this.updateLineChart();
          }
        }
      }, 300);
    }
  }
  
  private lineChart?: Chart<'line'>;
  private routerSubscription?: Subscription;

  selectedStock: Stock | null = null;
  selectedCountry: string = 'all';
  
  // Panel de compra
  cantidadCompra: number = 1;
  precioCompra: number = 0;
  totalCompra: number = 0;

  // Estadísticas rápidas
  stats = [
    { label: 'Valor Total', value: '$0', change: '+0%', positive: true },
    { label: 'Ganancia del Día', value: '$0', change: '+0%', positive: true },
    { label: 'Ganancia Mensual', value: '$0', change: '+0%', positive: true },
    { label: 'Total de Acciones', value: '0', change: '+0', positive: true }
  ];

  // Compras realizadas (solo para inversionistas)
  purchases: Orden[] = [];

  stocks: Stock[] = [
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

  get filteredStocks(): Stock[] {
    if (this.selectedCountry === 'all') {
      return this.stocks;
    }
    return this.stocks.filter(stock => stock.country === this.selectedCountry);
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private ordersService: OrdersService,
    private contractsService: ContractsService,
    private storageService: StorageService,
    private recommendationsService: RecommendationsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Verificar si es comisionista
    this.isComisionista = this.currentUser.tipo === 'comisionista';
    
    if (this.isComisionista) {
      // Cargar todos los contratos
      this.loadContracts();
      
      // Cargar recomendaciones creadas
      this.loadMisRecomendaciones();
      
      // El comisionista también puede ver gráficos, filtrar y comprar
      // Seleccionar ECOPETROL por defecto
      const ecopetrol = this.stocks.find(stock => stock.symbol === 'ECOPETROL');
      if (ecopetrol) {
        this.selectedStock = ecopetrol;
        this.precioCompra = ecopetrol.price;
        this.calculateTotal();
      }
      
      // Escuchar cambios de ruta para actualizar cuando se vuelva al dashboard
      this.routerSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          if (event.url === '/dashboard') {
            this.loadContracts();
            this.loadMisRecomendaciones();
          }
        });
    } else {
      // Cargar recomendaciones para accionistas
      this.loadRecommendations();
      
      // Seleccionar ECOPETROL por defecto
      const ecopetrol = this.stocks.find(stock => stock.symbol === 'ECOPETROL');
      if (ecopetrol) {
        this.selectedStock = ecopetrol;
        this.precioCompra = ecopetrol.price;
        this.calculateTotal();
      }

      // Calcular estadísticas iniciales
      this.updateStats();

      // Cargar compras realizadas
      this.loadPurchases();

      // Escuchar cambios de ruta para actualizar estadísticas cuando se vuelva al dashboard
      this.routerSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          if (event.url === '/dashboard') {
            this.updateStats();
            this.loadRecommendations();
            this.loadPurchases();
          }
        });
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    // Inicializar gráfico para ambos roles (comisionista y accionista)
    // Esperar un tick para asegurar que los elementos estén renderizados
    setTimeout(() => {
      this.initLineChart();
      // Si hay una acción seleccionada, actualizar el gráfico
      if (this.selectedStock) {
        this.updateLineChart();
      }
    }, 100);

    // Si es comisionista, inicializar gráfico cuando cambie de tab
    if (this.isComisionista) {
      // Escuchar cambios en el tab seleccionado
      setTimeout(() => {
        if (this.selectedTabIndex === 1 && this.lineChartCanvas) {
          this.initLineChart();
          if (this.selectedStock) {
            this.updateLineChart();
          }
        }
      }, 200);
    }
  }

  selectStock(stock: Stock): void {
    this.selectedStock = stock;
    this.precioCompra = stock.price;
    this.calculateTotal();
    this.updateLineChart();
  }

  calculateTotal(): void {
    this.totalCompra = this.cantidadCompra * this.precioCompra;
  }

  onCantidadChange(): void {
    this.calculateTotal();
  }

  comprarAccion(): void {
    if (!this.selectedStock || !this.currentUser) {
      return;
    }

    if (this.cantidadCompra <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    // Si es comisionista, crear recomendación en lugar de redirigir al contrato
    if (this.isComisionista) {
      // Crear recomendación basada en la compra del comisionista
      this.recommendationsService.createRecommendation(
        this.currentUser.id,
        this.currentUser.nombre,
        this.selectedStock.symbol,
        this.selectedStock.name,
        this.selectedStock.country,
        this.cantidadCompra,
        this.precioCompra,
        `Recomendación del comisionista ${this.currentUser.nombre}`
      );

      // Recargar recomendaciones creadas
      this.loadMisRecomendaciones();

      // Mostrar mensaje de confirmación
      this.snackBar.open(
        `Recomendación creada: ${this.cantidadCompra} acciones de ${this.selectedStock.symbol} a $${this.precioCompra.toFixed(2)}`,
        'Cerrar',
        {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        }
      );

      // Cambiar a la pestaña de recomendaciones para ver la nueva recomendación
      this.selectedTabIndex = 1;

      // Limpiar campos
      this.cantidadCompra = 1;
      this.calculateTotal();
    } else {
      // Para accionistas, redirigir al componente de contrato con los parámetros
      this.router.navigate(['/contract'], {
        queryParams: {
          symbol: this.selectedStock.symbol,
          cantidad: this.cantidadCompra,
          precio: this.precioCompra
        }
      });
    }
  }

  updateStats(): void {
    if (!this.currentUser) return;

    const orders = this.ordersService.getOrdersByUser(this.currentUser.id);
    const completedOrders = orders.filter(o => o.estado === 'completada');

    // Calcular Valor Total de la cartera (precio actual * cantidad de cada acción)
    let valorTotal = 0;
    let valorInvertido = 0;
    const stockQuantities: { [key: string]: number } = {};
    const stockCosts: { [key: string]: number } = {};

    completedOrders.forEach(order => {
      const stock = this.stocks.find(s => s.symbol === order.id_accion);
      if (!stock) return;

      if (!stockQuantities[order.id_accion]) {
        stockQuantities[order.id_accion] = 0;
        stockCosts[order.id_accion] = 0;
      }

      if (order.tipo === 'compra') {
        stockQuantities[order.id_accion] += order.cantidad;
        stockCosts[order.id_accion] += order.cantidad * order.precio;
      } else if (order.tipo === 'venta') {
        stockQuantities[order.id_accion] -= order.cantidad;
        stockCosts[order.id_accion] -= order.cantidad * order.precio;
        if (stockQuantities[order.id_accion] < 0) stockQuantities[order.id_accion] = 0;
        if (stockCosts[order.id_accion] < 0) stockCosts[order.id_accion] = 0;
      }
    });

    // Calcular valor total actual (precio actual * cantidad) y valor invertido
    Object.keys(stockQuantities).forEach(symbol => {
      const quantity = stockQuantities[symbol];
      if (quantity > 0) {
        const stock = this.stocks.find(s => s.symbol === symbol);
        if (stock) {
          valorTotal += stock.price * quantity;
          valorInvertido += stockCosts[symbol];
        }
      }
    });

    // Calcular Ganancia del Día (valor actual de compras de hoy - costo de compras de hoy)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = completedOrders.filter(order => {
      const orderDate = new Date(order.fecha_orden);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    let costoComprasDia = 0;
    let valorActualComprasDia = 0;
    todayOrders.forEach(order => {
      if (order.tipo === 'compra') {
        const stock = this.stocks.find(s => s.symbol === order.id_accion);
        if (stock) {
          costoComprasDia += order.cantidad * order.precio;
          valorActualComprasDia += order.cantidad * stock.price;
        }
      } else if (order.tipo === 'venta') {
        // Las ventas del día generan ganancia real
        const stock = this.stocks.find(s => s.symbol === order.id_accion);
        if (stock) {
          // Buscar el precio de compra promedio de esa acción
          const comprasAccion = completedOrders.filter(
            o => o.id_accion === order.id_accion && o.tipo === 'compra' && o.estado === 'completada'
          );
          const costoPromedio = comprasAccion.length > 0
            ? comprasAccion.reduce((sum, o) => sum + o.precio, 0) / comprasAccion.length
            : stock.price;
          valorActualComprasDia += order.cantidad * (stock.price - costoPromedio);
        }
      }
    });
    const gananciaDia = valorActualComprasDia - costoComprasDia;
    const cambioDia = costoComprasDia > 0 ? ((gananciaDia / costoComprasDia) * 100) : 0;

    // Calcular Ganancia Mensual (similar al día pero para todo el mes)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthOrders = completedOrders.filter(order => {
      const orderDate = new Date(order.fecha_orden);
      return orderDate >= startOfMonth;
    });

    let costoComprasMes = 0;
    let valorActualComprasMes = 0;
    monthOrders.forEach(order => {
      if (order.tipo === 'compra') {
        const stock = this.stocks.find(s => s.symbol === order.id_accion);
        if (stock) {
          costoComprasMes += order.cantidad * order.precio;
          valorActualComprasMes += order.cantidad * stock.price;
        }
      } else if (order.tipo === 'venta') {
        const stock = this.stocks.find(s => s.symbol === order.id_accion);
        if (stock) {
          const comprasAccion = completedOrders.filter(
            o => o.id_accion === order.id_accion && o.tipo === 'compra' && o.estado === 'completada'
          );
          const costoPromedio = comprasAccion.length > 0
            ? comprasAccion.reduce((sum, o) => sum + o.precio, 0) / comprasAccion.length
            : stock.price;
          valorActualComprasMes += order.cantidad * (stock.price - costoPromedio);
        }
      }
    });
    const gananciaMensual = valorActualComprasMes - costoComprasMes;
    const cambioMensual = costoComprasMes > 0 ? ((gananciaMensual / costoComprasMes) * 100) : 0;

    // Calcular ganancia total (diferencia entre valor actual y valor invertido)
    const gananciaTotal = valorTotal - valorInvertido;
    const gananciaPercent = valorInvertido > 0 ? (gananciaTotal / valorInvertido) * 100 : 0;

    // Total de acciones únicas
    const uniqueStocks = Object.keys(stockQuantities).filter(symbol => stockQuantities[symbol] > 0);
    const totalAcciones = uniqueStocks.length;

    // Actualizar estadísticas
    this.stats = [
      { 
        label: 'Valor Total', 
        value: `$${valorTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        change: `${gananciaPercent >= 0 ? '+' : ''}${gananciaPercent.toFixed(2)}%`, 
        positive: gananciaPercent >= 0 
      },
      { 
        label: 'Ganancia del Día', 
        value: `$${gananciaDia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        change: `${cambioDia >= 0 ? '+' : ''}${Math.abs(cambioDia).toFixed(1)}%`, 
        positive: gananciaDia >= 0 
      },
      { 
        label: 'Ganancia Mensual', 
        value: `$${gananciaMensual.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        change: `${cambioMensual >= 0 ? '+' : ''}${Math.abs(cambioMensual).toFixed(1)}%`, 
        positive: gananciaMensual >= 0 
      },
      { 
        label: 'Total de Acciones', 
        value: totalAcciones.toString(), 
        change: `+${totalAcciones}`, 
        positive: true 
      }
    ];
  }

  onCountryChange(): void {
    if (this.selectedStock && this.selectedCountry !== 'all') {
      if (this.selectedStock.country !== this.selectedCountry) {
        this.selectedStock = null;
      }
    }
    if (!this.selectedStock) {
      this.updateLineChart();
    }
  }

  private initLineChart(): void {
    if (!this.lineChartCanvas) return;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.updateLineChart();
  }

  private updateLineChart(): void {
    if (!this.lineChartCanvas) return;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    let datasets: any[] = [];
    let labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let title = 'Evolución de Precios de Acciones';

    if (this.selectedStock) {
      // Mostrar solo la acción seleccionada
      const days = 12;
      const data: number[] = [];
      const basePrice = this.selectedStock.price;
      
      for (let i = 0; i < days; i++) {
        const variation = (Math.random() - 0.5) * 0.15;
        const monthPrice = basePrice * (1 + variation * (i / days));
        data.push(Number(monthPrice.toFixed(2)));
      }

      datasets = [{
        data: data,
        label: `${this.selectedStock.symbol} - ${this.selectedStock.name}`,
        borderColor: this.selectedStock.changePercent >= 0 ? '#38a169' : '#e53e3e',
        backgroundColor: this.selectedStock.changePercent >= 0 
          ? 'rgba(56, 161, 105, 0.2)' 
          : 'rgba(229, 62, 62, 0.2)',
        tension: 0.4,
        fill: true
      }];
      title = `${this.selectedStock.symbol} - Últimos 12 meses`;
    } else {
      // Mostrar gráfico por defecto con múltiples acciones
      datasets = [
        {
          data: [65, 59, 80, 81, 56, 55, 70, 75, 82, 90, 88, 95],
          label: 'AAPL',
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          data: [28, 48, 40, 19, 86, 27, 90, 85, 92, 88, 95, 100],
          label: 'GOOGL',
          borderColor: '#764ba2',
          backgroundColor: 'rgba(118, 75, 162, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          data: [45, 52, 60, 55, 70, 68, 75, 80, 85, 88, 90, 92],
          label: 'MSFT',
          borderColor: '#f093fb',
          backgroundColor: 'rgba(240, 147, 251, 0.2)',
          tension: 0.4,
          fill: true
        }
      ];
    }

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: title
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                if (typeof value === 'number') {
                  return '$' + value.toFixed(2);
                }
                return '$' + value;
              }
            }
          }
        }
      }
    });
  }


  navigateToStocks(): void {
    this.router.navigate(['/stocks']);
  }

  logout(): void {
    this.authService.logout();
  }

  // Métodos para comisionista
  loadContracts(): void {
    this.contracts = this.contractsService.getContracts();
    // Parsear detalles de cada contrato
    this.contracts.forEach(contrato => {
      this.parseContractDetails(contrato);
    });
    // Ordenar por fecha más reciente primero
    this.contracts.sort((a, b) => 
      new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    );
  }

  parseContractDetails(contrato: Contrato): void {
    const detalles = contrato.detalles;
    const details: any = {};
    
    // Extraer información del inversionista
    const investorMatch = detalles.match(/INVERSIONISTA: (.+)/);
    const investorIdMatch = detalles.match(/ID INVERSIONISTA: (.+)/);
    const emailMatch = detalles.match(/EMAIL: (.+)/);
    
    // Extraer información de la acción
    const actionMatch = detalles.match(/Acción: (.+)/);
    const countryMatch = detalles.match(/País: (.+)/);
    const cantidadMatch = detalles.match(/Cantidad: (\d+)\s*acciones?/);
    const precioMatch = detalles.match(/Precio unitario: \$(.+)/);
    const totalMatch = detalles.match(/Valor total: \$(.+)/);
    
    if (investorMatch) details.investorName = investorMatch[1];
    if (investorIdMatch) details.investorId = investorIdMatch[1];
    if (emailMatch) details.email = emailMatch[1];
    if (actionMatch) {
      const actionParts = actionMatch[1].split(' - ');
      details.symbol = actionParts[0];
      details.stockName = actionParts[1] || actionParts[0];
    }
    if (countryMatch) details.country = countryMatch[1];
    if (cantidadMatch) details.cantidad = parseInt(cantidadMatch[1]);
    if (precioMatch) details.precio = parseFloat(precioMatch[1]);
    if (totalMatch) details.total = parseFloat(totalMatch[1]);

    // Obtener información del usuario inversionista
    const allUsers = this.storageService.getUsers();
    const investor = allUsers.find(u => u.id === contrato.id_inversionista);
    if (investor) {
      details.investorName = investor.nombre;
      details.email = investor.email;
    }

    this.contractDetailsMap.set(contrato.id_contrato, details);
  }

  getContractDetails(id: number): any {
    return this.contractDetailsMap.get(id) || {};
  }

  // Métodos para recomendaciones
  loadRecommendations(): void {
    this.recomendaciones = this.recommendationsService.getRecentRecommendations(10);
  }

  toggleRecomendaciones(): void {
    this.mostrarRecomendaciones = !this.mostrarRecomendaciones;
  }

  aplicarRecomendacion(recomendacion: Recomendacion): void {
    // Buscar la acción en la lista de stocks
    const stock = this.stocks.find(s => s.symbol === recomendacion.id_accion);
    if (stock) {
      this.selectedStock = stock;
      this.precioCompra = recomendacion.precio;
      this.cantidadCompra = recomendacion.cantidad;
      this.calculateTotal();
      this.updateLineChart();
      
      // Scroll hasta el panel de compra
      setTimeout(() => {
        const purchasePanel = document.querySelector('.purchase-panel');
        if (purchasePanel) {
          purchasePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }

  // Métodos para recomendaciones del comisionista
  loadMisRecomendaciones(): void {
    if (!this.currentUser) return;
    this.recomendacionesCreadas = this.recommendationsService.getRecommendationsByCommissioner(this.currentUser.id)
      .sort((a, b) => new Date(b.fecha_recomendacion).getTime() - new Date(a.fecha_recomendacion).getTime());
  }

  eliminarRecomendacion(id_recomendacion: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta recomendación?')) {
      this.recommendationsService.deleteRecommendation(id_recomendacion);
      this.loadMisRecomendaciones();
      this.snackBar.open('Recomendación eliminada', 'Cerrar', {
        duration: 3000
      });
    }
  }

  // Método para cargar las compras realizadas
  loadPurchases(): void {
    if (!this.currentUser || this.isComisionista) return;
    
    this.purchases = this.ordersService.getPurchasedStocks(this.currentUser.id);
    // Ordenar por fecha más reciente primero
    this.purchases.sort((a, b) => 
      new Date(b.fecha_orden).getTime() - new Date(a.fecha_orden).getTime()
    );
  }

  // Método auxiliar para obtener el nombre de la acción desde el símbolo
  getStockName(symbol: string): string {
    const stock = this.stocks.find(s => s.symbol === symbol);
    return stock ? stock.name : symbol;
  }

  // Método auxiliar para obtener el país de la acción
  getStockCountry(symbol: string): string {
    const stock = this.stocks.find(s => s.symbol === symbol);
    return stock ? stock.country : '';
  }

  signAndDownloadContract(contrato: Contrato): void {
    const details = this.getContractDetails(contrato.id_contrato);
    if (!details) {
      this.snackBar.open('Error: No se pudieron cargar los detalles del contrato', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('CONTRATO DE COMPRA DE ACCIONES', 105, 20, { align: 'center' });
    
    // Línea divisoria
    doc.setDrawColor(0, 0, 0);
    doc.line(20, 25, 190, 25);
    
    let y = 35;
    doc.setFontSize(12);
    
    // Información del contrato
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CONTRATO', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`ID Contrato: ${contrato.id_contrato}`, 20, y);
    y += 7;
    doc.text(`ID Comisionista: ${contrato.id_comisionista}`, 20, y);
    y += 7;
    doc.text(`ID Inversionista: ${contrato.id_inversionista}`, 20, y);
    y += 7;
    doc.text(`Fecha de Creación: ${new Date(contrato.fecha_creacion).toLocaleString('es-ES')}`, 20, y);
    y += 15;
    
    // Información de la operación
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE LA OPERACIÓN', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    if (details.symbol && details.stockName) {
      doc.text(`Acción: ${details.symbol} - ${details.stockName}`, 20, y);
      y += 7;
    }
    if (details.country) {
      doc.text(`País: ${details.country}`, 20, y);
      y += 7;
    }
    if (details.cantidad) {
      doc.text(`Cantidad: ${details.cantidad} acciones`, 20, y);
      y += 7;
    }
    if (details.precio) {
      doc.text(`Precio Unitario: $${details.precio.toFixed(2)}`, 20, y);
      y += 7;
    }
    if (details.total) {
      doc.text(`Valor Total: $${details.total.toFixed(2)}`, 20, y);
      y += 7;
    }
    y += 15;
    
    // Información del inversionista
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL INVERSIONISTA', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    if (details.investorName) {
      doc.text(`Nombre: ${details.investorName}`, 20, y);
      y += 7;
    }
    if (details.email) {
      doc.text(`Email: ${details.email}`, 20, y);
      y += 7;
    }
    y += 15;
    
    // Información del comisionista
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL COMISIONISTA', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${this.currentUser?.nombre || 'N/A'}`, 20, y);
    y += 7;
    if (this.currentUser?.email) {
      doc.text(`Email: ${this.currentUser.email}`, 20, y);
      y += 7;
    }
    y += 15;
    
    // Firma
    doc.setFont('helvetica', 'bold');
    doc.text('FIRMAS', 20, y);
    y += 15;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Firma Comisionista:', 20, y);
    y += 20;
    doc.line(20, y - 5, 90, y - 5);
    doc.text(`${this.currentUser?.nombre || 'N/A'}`, 25, y + 5);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 25, y + 12);
    
    y += 25;
    doc.text('Firma Inversionista:', 20, y);
    y += 20;
    doc.line(20, y - 5, 90, y - 5);
    if (details.investorName) {
      doc.text(`${details.investorName}`, 25, y + 5);
    }
    doc.text(`Fecha: ${new Date(contrato.fecha_creacion).toLocaleDateString('es-ES')}`, 25, y + 12);
    
    y += 30;
    
    // Términos y condiciones
    doc.setFont('helvetica', 'bold');
    doc.text('TÉRMINOS Y CONDICIONES', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    const terms = [
      '1. El inversionista acepta la compra de acciones según los términos especificados.',
      '2. El comisionista actúa como intermediario en esta operación.',
      '3. Las acciones quedan registradas a nombre del inversionista una vez completada la transacción.',
      '4. Los precios de las acciones están sujetos a variación según las condiciones del mercado.',
      '5. El presente contrato tiene validez desde la fecha de creación hasta su ejecución completa.',
      '6. Este contrato ha sido firmado digitalmente por ambas partes.'
    ];
    
    terms.forEach(term => {
      const lines = doc.splitTextToSize(term, 170);
      lines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      });
      y += 3;
    });
    
    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    }
    
    // Guardar PDF
    const fileName = `Contrato_${details.symbol || 'N/A'}_${contrato.id_contrato}_Firmado.pdf`;
    doc.save(fileName);
    
    // Mostrar mensaje de confirmación
    this.snackBar.open('Contrato firmado y descargado exitosamente', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}

