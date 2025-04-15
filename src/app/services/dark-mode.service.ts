import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  private _modoOscuro = false;

  constructor() {
    const stored = localStorage.getItem('modoOscuro');
    this._modoOscuro = stored === 'true';
    this.aplicarModo();
  }

  get modoOscuro(): boolean {
    return this._modoOscuro;
  }

  toggleModo() {
    this._modoOscuro = !this._modoOscuro;
    localStorage.setItem('modoOscuro', this._modoOscuro.toString());
    this.aplicarModo();
  }

  aplicarModo() {
    const body = document.body;
    if (this._modoOscuro) {
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
    }
  }
}
