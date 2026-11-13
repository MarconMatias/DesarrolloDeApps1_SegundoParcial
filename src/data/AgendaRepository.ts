import {api} from '../lab/servicio';
import {alternar, aplicarEdicion, Ficha, hayEdicion, listar} from './archivo';

export const agendaRepository = {
  listar,
  alternar,
  hayEdicion,
  async sincronizar() {
    const respuesta = await api.get<Ficha[]>('/programa');
    await aplicarEdicion(respuesta.data);
  },
};
