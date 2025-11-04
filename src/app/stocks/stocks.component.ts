import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
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
import { User } from '../core/services/storage.service';

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

interface Stock {
  symbol: string;
  name: string;
  country: 'Colombia' | 'Ecuador' | 'Perú';
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

@Component({
  selector: 'app-stocks',
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
    MatSelectModule
  ],
  templateUrl: './stocks.component.html',
  styleUrl: './stocks.component.css'
})
export class StocksComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('stockChartCanvas') stockChartCanvas!: ElementRef<HTMLCanvasElement>;

  currentUser: User | null = null;
  selectedStock: Stock | null = null;
  selectedCountry: string = 'all';
  private stockChart?: Chart<'line'>;

  countries = ['all', 'Colombia', 'Ecuador', 'Perú'];

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
    public router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewInit(): void {
    // Esperar un tick para asegurar que los elementos estén renderizados
    setTimeout(() => {
      if (this.selectedStock) {
        this.initChart();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.stockChart) {
      this.stockChart.destroy();
    }
  }

  selectStock(stock: Stock): void {
    this.selectedStock = stock;
    setTimeout(() => {
      this.initChart();
    }, 100);
  }

  onCountryChange(): void {
    // Si el stock seleccionado no está en el filtro, deseleccionar
    if (this.selectedStock && this.selectedCountry !== 'all') {
      if (this.selectedStock.country !== this.selectedCountry) {
        this.selectedStock = null;
        if (this.stockChart) {
          this.stockChart.destroy();
          this.stockChart = undefined;
        }
      }
    }
  }

  private initChart(): void {
    if (!this.stockChartCanvas || !this.selectedStock) return;

    // Destruir gráfico anterior si existe
    if (this.stockChart) {
      this.stockChart.destroy();
    }

    const ctx = this.stockChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Generar datos simulados para los últimos 30 días
    const days = 30;
    const labels: string[] = [];
    const data: number[] = [];
    
    const basePrice = this.selectedStock.price;
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }));
      
      // Generar precio con variación aleatoria pero realista
      const variation = (Math.random() - 0.5) * 0.1; // ±5% de variación
      const dayPrice = basePrice * (1 + variation * (days - i) / days);
      data.push(Number(dayPrice.toFixed(2)));
    }

    this.stockChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${this.selectedStock.symbol} - ${this.selectedStock.name}`,
            data: data,
            borderColor: this.getColorByChange(this.selectedStock.changePercent),
            backgroundColor: this.getBackgroundColorByChange(this.selectedStock.changePercent),
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2
          }
        ]
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
            text: `Comportamiento de ${this.selectedStock.symbol} - Últimos 30 días`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                if (value === null || value === undefined) {
                  return `${context.dataset.label}: N/A`;
                }
                return `${context.dataset.label}: $${value.toFixed(2)}`;
              }
            }
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
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  private getColorByChange(changePercent: number): string {
    return changePercent >= 0 ? '#38a169' : '#e53e3e';
  }

  private getBackgroundColorByChange(changePercent: number): string {
    return changePercent >= 0 
      ? 'rgba(56, 161, 105, 0.1)' 
      : 'rgba(229, 62, 62, 0.1)';
  }

  logout(): void {
    this.authService.logout();
  }
}

