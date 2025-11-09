import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService, User } from './storage.service';
import { AuditService } from './audit.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private storageService: StorageService,
    private router: Router,
    private auditService: AuditService
  ) {}

  /**
   * Registra un nuevo usuario
   */
  register(userData: Omit<User, 'id' | 'fecha_registro'>): { success: boolean; message: string } {
    try {
      // Verificar si el email ya está registrado
      const existingUser = this.storageService.getUserByEmail(userData.email);
      
      if (existingUser) {
        return {
          success: false,
          message: 'Este correo electrónico ya está registrado'
        };
      }

      // Crear nuevo usuario con ID y fecha de registro
      const newUser: User = {
        id: this.generateId(),
        ...userData,
        fecha_registro: new Date().toISOString()
      };

      // Guardar usuario
      this.storageService.saveUser(newUser);

      // Registrar en auditoría
      this.auditService.log('REGISTRO_USUARIO', `Usuario registrado: ${newUser.email} (${newUser.tipo})`);

      return {
        success: true,
        message: 'Usuario registrado exitosamente'
      };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: 'Error al registrar el usuario. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Autentica un usuario
   */
  login(email: string, password: string): { success: boolean; message: string; user?: User } {
    try {
      // Verificar si es el admin
      if (email.toLowerCase() === 'admin@gmail.com' && password === '123456') {
        const adminUser: User = {
          id: 'admin-001',
          nombre: 'Administrador',
          email: 'admin@gmail.com',
          telefono: 'N/A',
          direccion: 'N/A',
          tipo: 'admin',
          password: '123456',
          fecha_registro: new Date().toISOString()
        };

        // Guardar usuario en sesión
        this.storageService.setCurrentUser(adminUser);

        // Registrar en auditoría
        this.auditService.log('LOGIN', `Admin inició sesión: ${adminUser.email}`);

        return {
          success: true,
          message: 'Inicio de sesión exitoso',
          user: adminUser
        };
      }

      const user = this.storageService.getUserByEmail(email);

      if (!user) {
        return {
          success: false,
          message: 'Credenciales inválidas. Verifica tu correo y contraseña.'
        };
      }

      if (user.password !== password) {
        return {
          success: false,
          message: 'Contraseña incorrecta'
        };
      }

      // Guardar usuario en sesión
      this.storageService.setCurrentUser(user);

      // Registrar en auditoría
      this.auditService.log('LOGIN', `Usuario inició sesión: ${user.email} (${user.tipo})`);

      return {
        success: true,
        message: 'Inicio de sesión exitoso',
        user: user
      };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error al iniciar sesión. Por favor, intenta nuevamente.'
      };
    }
  }

  /**
   * Cierra la sesión del usuario actual
   */
  logout(): void {
    const currentUser = this.storageService.getCurrentUser();
    if (currentUser) {
      // Registrar en auditoría antes de cerrar sesión
      this.auditService.log('LOGOUT', `Usuario cerró sesión: ${currentUser.email}`);
    }
    this.storageService.clearCurrentUser();
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.storageService.isLoggedIn();
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.storageService.getCurrentUser();
  }

  /**
   * Verifica si el usuario tiene credenciales guardadas (Recordarme)
   */
  hasRememberedCredentials(): boolean {
    return this.storageService.getRememberMe() !== null;
  }

  /**
   * Obtiene las credenciales recordadas
   */
  getRememberedCredentials(): { email: string; password: string } | null {
    return this.storageService.getRememberMe();
  }

  /**
   * Guarda las credenciales para "Recordarme"
   */
  rememberCredentials(email: string, password: string): void {
    this.storageService.saveRememberMe(email, password);
  }

  /**
   * Elimina las credenciales guardadas
   */
  forgetCredentials(): void {
    this.storageService.clearRememberMe();
  }

  /**
   * Genera un ID único para el usuario
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

