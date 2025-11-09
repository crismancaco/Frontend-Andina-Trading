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
import { StocksService, Stock } from '../core/services/stocks.service';

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

  get stocks(): Stock[] {
    return this.stocksService.getStocks();
  }

  get filteredStocks(): Stock[] {
    if (this.selectedCountry === 'all') {
      return this.stocks;
    }
    return this.stocks.filter(stock => stock.country === this.selectedCountry);
  }

  constructor(
    private authService: AuthService,
    public router: Router,
    private stocksService: StocksService
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

