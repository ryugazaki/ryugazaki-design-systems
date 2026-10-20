import { Routes } from '@angular/router';

const detail = () => import('./features/system-detail/system-detail').then((m) => m.SystemDetail);

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/catalog/catalog').then((m) => m.Catalog) },
  { path: 's/:slug', loadComponent: detail },
  { path: 's/:slug/:section', loadComponent: detail },
  { path: '**', redirectTo: '' },
];
