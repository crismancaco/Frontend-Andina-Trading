import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import { AuthService } from '../core/services/auth.service';
import { ContractsService, Contrato } from '../core/services/contracts.service';
import { OrdersService } from '../core/services/orders.service';
import { User } from '../core/services/storage.service';
import { SuccessDialogComponent } from './success-dialog.component';

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
  selector: 'app-contract',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './contract.component.html',
  styleUrl: './contract.component.css'
})
export class ContractComponent implements OnInit {
  currentUser: User | null = null;
  stock: Stock | null = null;
  cantidad: number = 1;
  precio: number = 0;
  contrato: Contrato | null = null;

  displayedColumns: string[] = ['campo', 'valor'];
  contractData: { campo: string; valor: string }[] = [];

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private contractsService: ContractsService,
    private ordersService: OrdersService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Obtener parámetros de la ruta
    this.route.queryParams.subscribe(params => {
      const symbol = params['symbol'];
      const cantidad = params['cantidad'];
      const precio = params['precio'];

      if (symbol && cantidad && precio) {
        this.stock = this.stocks.find(s => s.symbol === symbol) || null;
        this.cantidad = parseInt(cantidad) || 1;
        this.precio = parseFloat(precio) || 0;
        
        if (this.stock) {
          this.createContract();
        }
      } else {
        // Si no hay parámetros, redirigir al dashboard
        this.router.navigate(['/dashboard']);
      }
    });
  }

  createContract(): void {
    if (!this.stock || !this.currentUser) return;

    const detalles = `CONTRATO DE COMPRA DE ACCIONES

Las partes involucradas en el presente contrato son:

COMISIONISTA: Andina Trading Platform
ID COMISIONISTA: AND-001
INVERSIONISTA: ${this.currentUser.nombre}
ID INVERSIONISTA: ${this.currentUser.id}
EMAIL: ${this.currentUser.email}

DETALLES DE LA OPERACIÓN:
Acción: ${this.stock.symbol} - ${this.stock.name}
País: ${this.stock.country}
Cantidad: ${this.cantidad} acciones
Precio unitario: $${this.precio.toFixed(2)}
Valor total: $${(this.cantidad * this.precio).toFixed(2)}

TÉRMINOS Y CONDICIONES:
1. El inversionista acepta la compra de ${this.cantidad} acciones de ${this.stock.symbol} al precio unitario de $${this.precio.toFixed(2)}.
2. El valor total de la transacción es de $${(this.cantidad * this.precio).toFixed(2)}.
3. El comisionista Andina Trading Platform actúa como intermediario en esta operación.
4. Las acciones quedan registradas a nombre del inversionista una vez completada la transacción.
5. Los precios de las acciones están sujetos a variación según las condiciones del mercado.
6. El presente contrato tiene validez desde la fecha de creación hasta su ejecución completa.

FECHA DE CREACIÓN: ${new Date().toLocaleString('es-ES')}

Este contrato ha sido generado electrónicamente y tiene plena validez legal.`;

    this.contrato = this.contractsService.createContract(
      'AND-001', // ID del comisionista
      this.currentUser.id,
      detalles
    );

    // Crear la orden de compra
    this.ordersService.createOrder(
      this.currentUser.id,
      this.stock.symbol,
      'compra',
      this.cantidad,
      this.precio
    );

    // Preparar datos para la tabla
    this.contractData = [
      { campo: 'ID Contrato', valor: this.contrato.id_contrato.toString() },
      { campo: 'ID Comisionista', valor: this.contrato.id_comisionista },
      { campo: 'ID Inversionista', valor: this.contrato.id_inversionista },
      { campo: 'Fecha de Creación', valor: new Date(this.contrato.fecha_creacion).toLocaleString('es-ES') },
      { campo: 'Acción', valor: `${this.stock.symbol} - ${this.stock.name}` },
      { campo: 'País', valor: this.stock.country },
      { campo: 'Cantidad', valor: this.cantidad.toString() },
      { campo: 'Precio Unitario', valor: `$${this.precio.toFixed(2)}` },
      { campo: 'Valor Total', valor: `$${(this.cantidad * this.precio).toFixed(2)}` },
      { campo: 'Inversionista', valor: this.currentUser.nombre },
      { campo: 'Email', valor: this.currentUser.email }
    ];
  }

  downloadPDF(): void {
    if (!this.contrato || !this.stock || !this.currentUser) return;

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
    doc.text(`ID Contrato: ${this.contrato.id_contrato}`, 20, y);
    y += 7;
    doc.text(`ID Comisionista: ${this.contrato.id_comisionista}`, 20, y);
    y += 7;
    doc.text(`ID Inversionista: ${this.contrato.id_inversionista}`, 20, y);
    y += 7;
    doc.text(`Fecha de Creación: ${new Date(this.contrato.fecha_creacion).toLocaleString('es-ES')}`, 20, y);
    y += 15;
    
    // Información de la operación
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE LA OPERACIÓN', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Acción: ${this.stock.symbol} - ${this.stock.name}`, 20, y);
    y += 7;
    doc.text(`País: ${this.stock.country}`, 20, y);
    y += 7;
    doc.text(`Cantidad: ${this.cantidad} acciones`, 20, y);
    y += 7;
    doc.text(`Precio Unitario: $${this.precio.toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Valor Total: $${(this.cantidad * this.precio).toFixed(2)}`, 20, y);
    y += 15;
    
    // Información del inversionista
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL INVERSIONISTA', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${this.currentUser.nombre}`, 20, y);
    y += 7;
    doc.text(`Email: ${this.currentUser.email}`, 20, y);
    y += 15;
    
    // Términos y condiciones
    doc.setFont('helvetica', 'bold');
    doc.text('TÉRMINOS Y CONDICIONES', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    const terms = [
      `1. El inversionista acepta la compra de ${this.cantidad} acciones de ${this.stock.symbol} al precio unitario de $${this.precio.toFixed(2)}.`,
      '2. El comisionista Andina Trading Platform actúa como intermediario en esta operación.',
      '3. Las acciones quedan registradas a nombre del inversionista una vez completada la transacción.',
      '4. Los precios de las acciones están sujetos a variación según las condiciones del mercado.',
      '5. El presente contrato tiene validez desde la fecha de creación hasta su ejecución completa.'
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
    doc.save(`Contrato_${this.stock.symbol}_${this.contrato.id_contrato}.pdf`);
    
    // Mostrar modal de éxito
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      width: '400px',
      disableClose: true,
      panelClass: 'success-dialog-container'
    });

    // Después de cerrar el modal, redirigir al dashboard
    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/dashboard']);
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

