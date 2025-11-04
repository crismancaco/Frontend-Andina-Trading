import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly USER_KEY = 'andina_trading_users';
  private readonly CURRENT_USER_KEY = 'andina_trading_current_user';
  private readonly REMEMBER_ME_KEY = 'andina_trading_remember_me';

  /**
   * Guarda un valor en localStorage
   */
  setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      throw error;
    }
  }

  /**
   * Obtiene un valor de localStorage
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return null;
    }
  }

  /**
   * Elimina un valor de localStorage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
    }
  }

  /**
   * Limpia todo el localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }

  /**
   * Verifica si existe una clave en localStorage
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  // ============ Métodos específicos para usuarios ============

  /**
   * Guarda un nuevo usuario en la lista de usuarios registrados
   */
  saveUser(user: User): void {
    const users = this.getUsers();
    
    // Verificar si el usuario ya existe por email
    const existingUserIndex = users.findIndex(u => u.email === user.email);
    
    if (existingUserIndex !== -1) {
      // Actualizar usuario existente
      users[existingUserIndex] = user;
    } else {
      // Agregar nuevo usuario
      users.push(user);
    }
    
    this.setItem(this.USER_KEY, users);
  }

  /**
   * Obtiene todos los usuarios registrados
   */
  getUsers(): User[] {
    return this.getItem<User[]>(this.USER_KEY) || [];
  }

  /**
   * Busca un usuario por email
   */
  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Elimina un usuario por email
   */
  deleteUser(email: string): void {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    this.setItem(this.USER_KEY, filteredUsers);
  }

  // ============ Métodos para sesión actual ============

  /**
   * Guarda el usuario actual en sesión
   */
  setCurrentUser(user: User): void {
    this.setItem(this.CURRENT_USER_KEY, user);
  }

  /**
   * Obtiene el usuario actual en sesión
   */
  getCurrentUser(): User | null {
    return this.getItem<User>(this.CURRENT_USER_KEY);
  }

  /**
   * Elimina el usuario actual de la sesión (logout)
   */
  clearCurrentUser(): void {
    this.removeItem(this.CURRENT_USER_KEY);
  }

  /**
   * Verifica si hay un usuario en sesión
   */
  isLoggedIn(): boolean {
    return this.hasItem(this.CURRENT_USER_KEY);
  }

  // ============ Métodos para "Recordarme" ============

  /**
   * Guarda las credenciales cuando el usuario marca "Recordarme"
   */
  saveRememberMe(email: string, password: string): void {
    const credentials = { email, password };
    this.setItem(this.REMEMBER_ME_KEY, credentials);
  }

  /**
   * Obtiene las credenciales guardadas de "Recordarme"
   */
  getRememberMe(): { email: string; password: string } | null {
    return this.getItem<{ email: string; password: string }>(this.REMEMBER_ME_KEY);
  }

  /**
   * Elimina las credenciales de "Recordarme"
   */
  clearRememberMe(): void {
    this.removeItem(this.REMEMBER_ME_KEY);
  }
}

/**
 * Interfaz para los datos del usuario
 */
export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  tipo: 'inversionista' | 'comisionista';
  password: string; // En producción, esto NO debería guardarse en texto plano
  fecha_registro: string;
}

