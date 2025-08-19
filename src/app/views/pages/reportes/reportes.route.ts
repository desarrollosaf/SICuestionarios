import { Routes } from "@angular/router";

export default [
    {
        path: '',
        loadComponent: () => import('./reportes.component').then(c => c.ReportesComponent)
    }
] as Routes;