import React from 'react';
import {Text,View} from 'react-native';
import {elegirDia,elegirTema,recargar,usePrograma} from './programaModel';
import {Lista,Opcion,s} from './componentes';

export function Catalogo({abrir}:{abrir:(id:string)=>void}) {
  const {charlas,dia,tema,cargando,error,hayEdicion} = usePrograma();
  const visibles = charlas.filter(f=>(!dia || f.day===dia) && (tema==='Todos' || f.track===tema));
  return <View>
    <View style={s.fila}>{['Ambos días','Día 1','Día 2'].map((t,i)=>
      <Opcion key={t} texto={t} activa={dia===i} accion={()=>elegirDia(i)}/>)}</View>
    <View style={s.fila}>{['Todos','Android','Datos','Calidad'].map(t=>
      <Opcion key={t} texto={t} activa={tema===t} accion={()=>elegirTema(t)}/>)}</View>
    <Opcion texto="Actualizar" accion={()=>void recargar()}/>
    {cargando && <Text>Consultando programa…</Text>}
    {!hayEdicion ? (error==='sinDatos' && <View>
        <Text>No se pudo descargar el programa.</Text>
        <Opcion texto="Reintentar" accion={()=>void recargar()}/></View>)
      : charlas.length===0 ? <Text>sin charlas programadas</Text>
      : <Lista fichas={visibles} abrir={abrir}/>}
  </View>;
}
