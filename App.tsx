import React,{useEffect,useState} from 'react';
import {BackHandler,ScrollView,Text,View} from 'react-native';
import {configurar} from './src/data/archivo';
import {Catalogo} from './src/ui/Catalogo';
import {Mesa} from './src/ui/Mesa';
import {Lista,Opcion,s} from './src/ui/componentes';
import {abrirFicha,cargaInicial,elegirSeccion,iniciarSesion,marcar,usePrograma} from './src/ui/programaModel';

type Inicio = {taskKey:string; offlineStart?:boolean};
export default function App({taskKey,offlineStart}:Inicio) {
  const [lista,setLista] = useState(false);
  useEffect(()=>{
    setLista(false);
    (offlineStart ? configurar('disponible','no') : Promise.resolve())
      .then(()=>iniciarSesion(taskKey ?? ''))
      .catch(()=>{})
      .then(()=>setLista(true));
  },[taskKey,offlineStart]);
  return lista ? <Portada/> : <Text>Abriendo agenda…</Text>;
}

function Portada() {
  const {charlas,seccion,id,error} = usePrograma();
  const ficha = id ? charlas.find(f=>f.id===id) : undefined;
  useEffect(()=>{ cargaInicial(); },[]);
  useEffect(()=>{
    const sub = BackHandler.addEventListener('hardwareBackPress',()=>{
      if (id) { abrirFicha(null); return true; }
      if (seccion!=='Programa') { elegirSeccion('Programa'); return true; }
      return false;
    });
    return ()=>sub.remove();
  },[seccion,id]);
  return <View style={s.pagina}><Text>Jornadas del Sur</Text>
    <Text style={s.titulo}>{id?'Detalle':seccion}</Text>
    {error==='offline' && <Text>Sin conexión: se están usando datos guardados.</Text>}
    <ScrollView style={{flex:1}}>
      {id ? <View><Opcion texto="Volver" accion={()=>abrirFicha(null)}/>
        {ficha && <View><Text style={s.titulo}>{ficha.title}</Text><Text style={s.texto}>
          Día {ficha.day} · {ficha.time} · {ficha.room}</Text>
          <Text>{ficha.speaker}</Text><Text style={s.texto}>{ficha.summary}</Text>
          <Opcion texto={ficha.favorita?'Quitar de mi agenda':'Agregar a mi agenda'} accion={()=>void marcar(ficha.id)}/>
        </View>}</View>
      : seccion==='Programa' ? <Catalogo abrir={abrirFicha}/>
      : seccion==='Mesa' ? <Mesa/> : <View>
        {!charlas.some(f=>f.favorita) && <Text>Todavía no agregaste charlas.</Text>}
        <Lista fichas={charlas.filter(f=>f.favorita)} abrir={abrirFicha}/></View>}
    </ScrollView>
    {!id && <View style={s.fila}>{['Programa','Mi agenda','Mesa'].map(t=>
      <Opcion key={t} texto={t} activa={seccion===t} accion={()=>elegirSeccion(t)}/>)}</View>}
  </View>;
}
