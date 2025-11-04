import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

export interface Recomendacion {
  id_recomendacion: number;
  id_comisionista: string;
  nombre_comisionista: string;
  id_accion: string; // Símbolo de la acción
  nombre_accion: string;
  pais: string;
  cantidad: number;
  precio: number;
  valor_total: number;
  fecha_recomendacion: string; // ISO string del timestamp
  razon?: string; // Razón opcional de la recomendación
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationsService {
  private readonly RECOMMENDATIONS_KEY = 'andina_trading_recomendaciones';
  private recommendationIdCounter = 1;

  constructor(private storageService: StorageService) {
    this.initializeCounter();
  }

  private initializeCounter(): void {
    const recommendations = this.getRecommendations();
    if (recommendations.length > 0) {
      const maxId = Math.max(...recommendations.map(r => r.id_recomendacion));
      this.recommendationIdCounter = maxId + 1;
    }
  }

  /**
   * Crea una nueva recomendación basada en una compra del comisionista
   */
  createRecommendation(
    id_comisionista: string,
    nombre_comisionista: string,
    id_accion: string,
    nombre_accion: string,
    pais: string,
    cantidad: number,
    precio: number,
    razon?: string
  ): Recomendacion {
    const nuevaRecomendacion: Recomendacion = {
      id_recomendacion: this.recommendationIdCounter++,
      id_comisionista,
      nombre_comisionista,
      id_accion,
      nombre_accion,
      pais,
      cantidad,
      precio,
      valor_total: cantidad * precio,
      fecha_recomendacion: new Date().toISOString(),
      razon
    };

    const recommendations = this.getRecommendations();
    recommendations.push(nuevaRecomendacion);
    this.saveRecommendations(recommendations);

    return nuevaRecomendacion;
  }

  /**
   * Obtiene todas las recomendaciones
   */
  getRecommendations(): Recomendacion[] {
    return this.storageService.getItem<Recomendacion[]>(this.RECOMMENDATIONS_KEY) || [];
  }

  /**
   * Obtiene las recomendaciones más recientes (últimas N)
   */
  getRecentRecommendations(limit: number = 10): Recomendacion[] {
    const recommendations = this.getRecommendations();
    return recommendations
      .sort((a, b) => new Date(b.fecha_recomendacion).getTime() - new Date(a.fecha_recomendacion).getTime())
      .slice(0, limit);
  }

  /**
   * Obtiene las recomendaciones de un comisionista específico
   */
  getRecommendationsByCommissioner(id_comisionista: string): Recomendacion[] {
    return this.getRecommendations().filter(r => r.id_comisionista === id_comisionista);
  }

  /**
   * Obtiene las recomendaciones para una acción específica
   */
  getRecommendationsByStock(id_accion: string): Recomendacion[] {
    return this.getRecommendations().filter(r => r.id_accion === id_accion);
  }

  /**
   * Elimina una recomendación
   */
  deleteRecommendation(id_recomendacion: number): boolean {
    const recommendations = this.getRecommendations();
    const filteredRecommendations = recommendations.filter(r => r.id_recomendacion !== id_recomendacion);
    
    if (filteredRecommendations.length === recommendations.length) {
      return false; // No se encontró la recomendación
    }

    this.saveRecommendations(filteredRecommendations);
    return true;
  }

  private saveRecommendations(recommendations: Recomendacion[]): void {
    this.storageService.setItem(this.RECOMMENDATIONS_KEY, recommendations);
  }
}

