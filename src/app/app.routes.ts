import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'stocks',
    loadComponent: () => import('./stocks/stocks.component').then(m => m.StocksComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contract',
    loadComponent: () => import('./contract/contract.component').then(m => m.ContractComponent),
    canActivate: [authGuard]
  }
];
