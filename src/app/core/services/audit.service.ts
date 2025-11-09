import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

export interface AuditLog {
  id: string;
  usuario: string;
  usuarioId: string;
  accion: string;
  detalles: string;
  fecha: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly AUDIT_KEY = 'andina_trading_audit_logs';
  private readonly MAX_LOGS = 1000; // Mantener solo los últimos 1000 logs

  constructor(private storageService: StorageService) {}

  /**
   * Registra una acción en el log de auditoría
   */
  log(accion: string, detalles: string = ''): void {
    try {
      const currentUser = this.storageService.getCurrentUser();
      const usuario = currentUser ? currentUser.nombre : 'Sistema';
      const usuarioId = currentUser ? currentUser.id : 'system';
      const email = currentUser ? currentUser.email : 'sistema';

      const log: AuditLog = {
        id: this.generateId(),
        usuario: `${usuario} (${email})`,
        usuarioId: usuarioId,
        accion: accion,
        detalles: detalles,
        fecha: new Date().toLocaleString('es-ES'),
        timestamp: Date.now()
      };

      const logs = this.getLogs();
      logs.unshift(log); // Agregar al inicio

      // Mantener solo los últimos MAX_LOGS
      if (logs.length > this.MAX_LOGS) {
        logs.splice(this.MAX_LOGS);
      }

      this.storageService.setItem(this.AUDIT_KEY, logs);
    } catch (error) {
      console.error('Error al registrar log de auditoría:', error);
    }
  }

  /**
   * Obtiene todos los logs de auditoría
   */
  getLogs(): AuditLog[] {
    return this.storageService.getItem<AuditLog[]>(this.AUDIT_KEY) || [];
  }

  /**
   * Obtiene logs filtrados por usuario
   */
  getLogsByUser(usuarioId: string): AuditLog[] {
    return this.getLogs().filter(log => log.usuarioId === usuarioId);
  }

  /**
   * Obtiene logs filtrados por acción
   */
  getLogsByAction(accion: string): AuditLog[] {
    return this.getLogs().filter(log => log.accion === accion);
  }

  /**
   * Limpia todos los logs
   */
  clearLogs(): void {
    this.storageService.setItem(this.AUDIT_KEY, []);
  }

  /**
   * Genera un ID único para el log
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

