import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { AuditService } from './audit.service';

export interface Contrato {
  id_contrato: number;
  id_comisionista: string;
  id_inversionista: string;
  detalles: string;
  fecha_creacion: string; // ISO string del timestamp
}

@Injectable({
  providedIn: 'root'
})
export class ContractsService {
  private readonly CONTRACTS_KEY = 'andina_trading_contratos';
  private contractIdCounter = 1;

  constructor(
    private storageService: StorageService,
    private auditService: AuditService
  ) {
    this.initializeCounter();
  }

  private initializeCounter(): void {
    const contracts = this.getContracts();
    if (contracts.length > 0) {
      const maxId = Math.max(...contracts.map(c => c.id_contrato));
      this.contractIdCounter = maxId + 1;
    }
  }

  createContract(
    id_comisionista: string,
    id_inversionista: string,
    detalles: string
  ): Contrato {
    const nuevoContrato: Contrato = {
      id_contrato: this.contractIdCounter++,
      id_comisionista,
      id_inversionista,
      detalles,
      fecha_creacion: new Date().toISOString()
    };

    const contracts = this.getContracts();
    contracts.push(nuevoContrato);
    this.saveContracts(contracts);

    // Registrar en auditoría
    this.auditService.log('CREAR_CONTRATO', `Contrato #${nuevoContrato.id_contrato} creado - Inversionista: ${id_inversionista}, Comisionista: ${id_comisionista}`);

    return nuevoContrato;
  }

  getContracts(): Contrato[] {
    return this.storageService.getItem<Contrato[]>(this.CONTRACTS_KEY) || [];
  }

  getContractsByInvestor(id_inversionista: string): Contrato[] {
    return this.getContracts().filter(c => c.id_inversionista === id_inversionista);
  }

  getContractsByCommissioner(id_comisionista: string): Contrato[] {
    return this.getContracts().filter(c => c.id_comisionista === id_comisionista);
  }

  getContractById(id_contrato: number): Contrato | null {
    return this.getContracts().find(c => c.id_contrato === id_contrato) || null;
  }

  private saveContracts(contracts: Contrato[]): void {
    this.storageService.setItem(this.CONTRACTS_KEY, contracts);
  }
}

