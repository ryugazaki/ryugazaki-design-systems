import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/catalog/catalog').then((m) => m.Catalog) },
  { path: '**', redirectTo: '' },
];
