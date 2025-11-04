import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <div class="success-dialog">
      <div class="success-logo">
        <span class="logo-at">AT</span>
      </div>
      <h2 class="success-title">¡Acción creada con éxito!</h2>
      <p class="success-message">El contrato ha sido firmado y descargado correctamente.</p>
      <button mat-raised-button color="primary" (click)="close()" class="close-button">
        Aceptar
      </button>
    </div>
  `,
  styles: [`
    .success-dialog {
      padding: 3rem 2.5rem;
      text-align: center;
      min-width: 350px;
      max-width: 450px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .success-logo {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .logo-at {
      font-size: 4rem;
      font-weight: 700;
      color: #4caf50;
      letter-spacing: -2px;
      line-height: 1;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: inline-block;
      text-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
    }

    .logo-at::first-letter {
      margin-right: -4px;
    }

    .success-title {
      margin: 0 0 1rem 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #2d3748;
      line-height: 1.3;
    }

    .success-message {
      margin: 0 0 2rem 0;
      color: #4a5568;
      font-size: 1rem;
      line-height: 1.5;
      max-width: 100%;
    }

    .close-button {
      min-width: 140px;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 8px;
      text-transform: none;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .close-button:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transform: translateY(-1px);
    }
  `]
})
export class SuccessDialogComponent {
  constructor(private dialogRef: MatDialogRef<SuccessDialogComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}

