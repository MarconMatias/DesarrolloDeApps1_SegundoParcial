import {useSyncExternalStore} from 'react';
import {agendaRepository as repo} from '../data/AgendaRepository';
import {ajuste, Charla, configurar} from '../data/archivo';

type Lectura = {seccion: string; id: string | null; dia: number; tema: string};
type Estado = Lectura & {
  charlas: Charla[];
  cargando: boolean;
  hayEdicion: boolean;
  error: '' | 'offline' | 'sinDatos';
};

const LECTURA_INICIAL: Lectura = {seccion: 'Programa', id: null, dia: 0, tema: 'Todos'};
const CLAVES_LECTURA = Object.keys(LECTURA_INICIAL) as (keyof Lectura)[];

let estado: Estado = {...LECTURA_INICIAL, charlas: [], cargando: false, hayEdicion: false, error: ''};
let tarea = '';
const observadores = new Set<() => void>();

function publicar(cambios: Partial<Estado>) {
  estado = {...estado, ...cambios};
  if (tarea && CLAVES_LECTURA.some(k => k in cambios)) {
    const lectura = Object.fromEntries(CLAVES_LECTURA.map(k => [k, estado[k]]));
    void configurar('lectura', JSON.stringify({tarea, ...lectura})).catch(() => {});
  }
  observadores.forEach(fn => fn());
}
function suscribir(fn: () => void) {
  observadores.add(fn);
  return () => { observadores.delete(fn); };
}
export function usePrograma() {
  return useSyncExternalStore(suscribir, () => estado);
}

export async function iniciarSesion(claveTarea: string) {
  let lectura = LECTURA_INICIAL;
  try {
    const guardada = JSON.parse(await ajuste('lectura', '{}'));
    if (claveTarea && guardada.tarea === claveTarea) {
      lectura = {
        seccion: typeof guardada.seccion === 'string' ? guardada.seccion : LECTURA_INICIAL.seccion,
        id: typeof guardada.id === 'string' ? guardada.id : null,
        dia: typeof guardada.dia === 'number' ? guardada.dia : 0,
        tema: typeof guardada.tema === 'string' ? guardada.tema : LECTURA_INICIAL.tema,
      };
    }
  } catch {}
  tarea = claveTarea;
  publicar({...lectura});
  try {
    publicar({charlas: await repo.listar(), hayEdicion: await repo.hayEdicion()});
  } catch {}
}

export const elegirDia = (dia: number) => publicar({dia});
export const elegirTema = (tema: string) => publicar({tema});
export const elegirSeccion = (seccion: string) => publicar({seccion});
export const abrirFicha = (id: string | null) => publicar({id});

let enCurso: Promise<void> | null = null;
let siguiente: Promise<void> | null = null;
let cargaAutomaticaHecha = false;

export function cargaInicial() {
  if (cargaAutomaticaHecha) return;
  cargaAutomaticaHecha = true;
  void recargar();
}

export function recargar(): Promise<void> {
  if (!enCurso) {
    enCurso = sincronizar().finally(() => { enCurso = null; });
    return enCurso;
  }
  if (!siguiente) siguiente = enCurso.then(() => { siguiente = null; return recargar(); });
  return siguiente;
}

async function sincronizar() {
  publicar({cargando: true});
  try {
    await repo.sincronizar();
    publicar({charlas: await repo.listar(), hayEdicion: true, error: ''});
  } catch {
    let hay = estado.hayEdicion;
    try {
      hay = await repo.hayEdicion();
      publicar({charlas: await repo.listar()});
    } catch {}
    publicar({hayEdicion: hay, error: hay ? 'offline' : 'sinDatos'});
  } finally {
    publicar({cargando: false});
  }
}

export async function marcar(id: string) {
  await repo.alternar(id);
  publicar({charlas: await repo.listar()});
}
