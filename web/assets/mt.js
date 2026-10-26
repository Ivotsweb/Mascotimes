/* MascoTimes · pintado de noticias (sin inline, compatible con CSP 'self') */
(function () {
  'use strict';
  var API = 'https://api.mascotimes.com/webhook/';
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var page = document.body.getAttribute('data-page');

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function limpiar(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function dominio(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  var SECCIONES = ['Perros', 'Gatos', 'España', 'Legales'];
  var INTROS = {
    'Perros': 'Educación, salud, razas y vida diaria con tu perro.',
    'Gatos': 'Comportamiento, salud y hogar con tu gato.',
    'España': 'Lo que ocurre cerca de ti, ciudad a ciudad.',
    'Legales': 'Normas oficiales con su fecha de vigencia. Información orientativa: consulta a un profesional.'
  };
  function sec(n) { return n.seccion || n.categoria || 'Noticias'; }
  function etiqueta(c) { return c || 'Noticias'; }
  function autorHora(n) { return 'Redacción de MascoTimes' + (hora(n.fecha) ? ' · ' + hora(n.fecha) : ''); }
  function fechaLarga(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }
  function hora(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function urlNoticia(n) { return '/noticia/?id=' + encodeURIComponent(n.id); }

  // Fecha de hoy en la barra superior
  var f = document.getElementById('fecha-hoy');
  if (f) f.textContent = fechaLarga(new Date().toISOString());

  function foto(n, clase, eager) {
    var fig = el('a', 'foto' + (clase ? ' ' + clase : ''));
    fig.href = urlNoticia(n);
    fig.setAttribute('aria-label', n.titular);
    if (n.imagen) {
      var img = el('img');
      img.loading = eager ? 'eager' : 'lazy';
      img.alt = 'Ilustración generada con IA para: ' + n.titular;
      img.src = API + 'foto-publica?g=' + encodeURIComponent(n.id);
      img.addEventListener('error', function () { img.remove(); fig.appendChild(el('span', 'sin', 'MascoTimes')); });
      fig.appendChild(img);
    } else {
      fig.appendChild(el('span', 'sin', 'MascoTimes'));
    }
    return fig;
  }

  function enlaceTitulo(tag, n) {
    var h = el(tag);
    var a = el('a', null, n.titular);
    a.href = urlNoticia(n);
    h.appendChild(a);
    return h;
  }

  function lateral(titulo, lista) {
    var p = el('div', 'panel');
    p.appendChild(el('span', 'kicker', titulo));
    lista.forEach(function (n) {
      var d = el('p', 'lista-i');
      var a = el('a', null, n.titular);
      a.href = urlNoticia(n);
      d.appendChild(a);
      d.appendChild(el('small', null, sec(n) + ' · ' + fechaLarga(n.fecha)));
      p.appendChild(d);
    });
    return p;
  }

  /* Tarjeta horizontal (miniatura + categoría + titular + hora), como en el mockup */
  function tarjetaH(n) {
    var t = el('article', 'tarjeta-h');
    var f = el('div', 'miniatura');
    f.appendChild(foto(n, 'thumb'));
    t.appendChild(f);
    var c = el('div', 'cuerpo');
    c.appendChild(el('span', 'kicker', sec(n)));
    c.appendChild(enlaceTitulo('h3', n));
    c.appendChild(el('span', 'autor', autorHora(n)));
    t.appendChild(c);
    return t;
  }

  /* Cabecera de sección con doble filete */
  function cabSeccion(titulo, enlaceTxt, alClic) {
    var d = el('div', 'sec-t');
    d.appendChild(el('h2', null, titulo));
    if (enlaceTxt) {
      var a = el('a', null, enlaceTxt);
      a.href = '/noticias/';
      if (alClic) a.addEventListener('click', function (e) { e.preventDefault(); alClic(); });
      d.appendChild(a);
    }
    return d;
  }

  function cargar(cb) {
    fetch(API + 'noticias-publicas')
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (j) { cb((j && j.noticias) || []); })
      .catch(function () {
        var t = document.getElementById('contenido');
        if (t) { limpiar(t); t.appendChild(el('p', 'estado', 'No hemos podido cargar las noticias ahora mismo. Inténtalo de nuevo en unos minutos.')); }
      });
  }

  /* Reparte las noticias para que no se repitan en la misma página y se mezclen las secciones */
  function repartir(ns, nUltima, nSec) {
    var resto = ns.slice(1);
    var ultima = [];
    var i = 0;
    var vistas = {};
    resto.forEach(function (n) { if (ultima.length < nUltima && !vistas[sec(n)]) { vistas[sec(n)] = 1; ultima.push(n); } });
    resto.forEach(function (n) { if (ultima.length < nUltima && ultima.indexOf(n) < 0) ultima.push(n); });
    resto = resto.filter(function (n) { return ultima.indexOf(n) < 0; });
    var secundarias = [];
    var vistas2 = {};
    resto.forEach(function (n) { if (secundarias.length < nSec && !vistas2[sec(n)]) { vistas2[sec(n)] = 1; secundarias.push(n); } });
    resto.forEach(function (n) { if (secundarias.length < nSec && secundarias.indexOf(n) < 0) secundarias.push(n); });
    resto = resto.filter(function (n) { return secundarias.indexOf(n) < 0; });
    return { portada: ns[0], ultima: ultima, secundarias: secundarias, mas: resto };
  }

  /* ---------- Portada ---------- */
  function pintarPortada(ns) {
    var raiz = document.getElementById('contenido');
    var mas = document.getElementById('mas');
    limpiar(raiz);
    if (!ns.length) { raiz.appendChild(el('p', 'estado', 'Hoy todavía no hay noticias. Vuelve pronto.')); return; }
    var r = repartir(ns, 4, 2);

    var main = el('section', 'portada');
    /* Columna izquierda: Última hora */
    var izq = el('aside', 'col-izq');
    izq.appendChild(el('h2', 'col-t', 'Última hora'));
    r.ultima.forEach(function (n) {
      var a = el('article', 'item');
      a.appendChild(el('span', 'kicker', sec(n)));
      a.appendChild(enlaceTitulo('h3', n));
      a.appendChild(el('span', 'autor', autorHora(n)));
      izq.appendChild(a);
    });
    main.appendChild(izq);

    /* Columna central: Portada del día */
    var cen = el('section', 'col-cen');
    cen.appendChild(el('span', 'kicker', 'Portada del día'));
    cen.appendChild(enlaceTitulo('h2', r.portada));
    cen.appendChild(foto(r.portada, 'hero-foto', true));
    cen.appendChild(el('span', 'pie-foto', 'Ilustración generada con IA, MascoTimes'));
    cen.appendChild(el('p', 'resumen', r.portada.entradilla));
    var p = el('p', 'leer');
    var l = el('a', null, 'Leer la noticia completa');
    l.href = urlNoticia(r.portada);
    p.appendChild(l);
    cen.appendChild(p);
    if (r.secundarias.length) {
      var dos = el('div', 'dos');
      r.secundarias.forEach(function (n) {
        var a = el('article', 'sec-card');
        a.appendChild(foto(n, 'mini'));
        a.appendChild(el('span', 'kicker', sec(n)));
        a.appendChild(enlaceTitulo('h3', n));
        a.appendChild(el('p', null, n.entradilla));
        dos.appendChild(a);
      });
      cen.appendChild(dos);
    }
    main.appendChild(cen);
    raiz.appendChild(main);

    /* Más noticias de hoy (debajo del bloque PawDatas) */
    if (mas) {
      limpiar(mas);
      if (r.mas.length) {
        mas.appendChild(cabSeccion('Más noticias de hoy', 'Ver todas'));
        mas.appendChild(el('p', 'intro-sec', 'Lo que no te puedes perder.'));
        var g = el('div', 'rej-h');
        r.mas.slice(0, 6).forEach(function (n) { g.appendChild(tarjetaH(n)); });
        mas.appendChild(g);
      }
    }
  }

  /* ---------- Listado de noticias ---------- */
  function pintarListado(ns) {
    var raiz = document.getElementById('contenido');
    var filtros = document.getElementById('filtros');
    var filtro = '';
    var presentes = SECCIONES.filter(function (s) { return ns.some(function (n) { return sec(n) === s; }); });

    function marcar() {
      Array.prototype.forEach.call(filtros.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === filtro));
      });
    }
    function elegir(f) { filtro = f; marcar(); dibujar(); window.scrollTo(0, 0); }

    limpiar(filtros);
    [''].concat(presentes).forEach(function (s) {
      var b = el('button', 'pill', s || 'Todas');
      b.type = 'button';
      b.setAttribute('data-f', s);
      b.addEventListener('click', function () { elegir(s); });
      filtros.appendChild(b);
    });
    marcar();

    function seccion(s, lista) {
      var sc = el('section', 'seccion');
      sc.id = s.toLowerCase().replace('ñ', 'n');
      sc.appendChild(cabSeccion(s, filtro ? '' : 'Ver todas', function () { elegir(s); }));
      sc.appendChild(el('p', 'intro-sec', INTROS[s] || ''));
      var g = el('div', 'rej-h');
      lista.forEach(function (n) { g.appendChild(tarjetaH(n)); });
      sc.appendChild(g);
      return sc;
    }

    function dibujar() {
      limpiar(raiz);
      if (!ns.length) { raiz.appendChild(el('p', 'estado', 'Todavía no hay noticias. Vuelve pronto.')); return; }
      if (filtro) {
        raiz.appendChild(seccion(filtro, ns.filter(function (n) { return sec(n) === filtro; })));
        return;
      }
      var top = ns[0];
      var hero = el('section', 'hero');
      var art = el('article', 'grande');
      art.appendChild(foto(top, 'noti-foto', true));
      var c = el('div', 'cuerpo-g');
      c.appendChild(el('span', 'kicker', 'Portada del día'));
      c.appendChild(enlaceTitulo('h2', top));
      c.appendChild(el('p', null, top.entradilla));
      c.appendChild(el('span', 'autor', 'Por la Redacción de MascoTimes · Fuentes citadas al final de la pieza'));
      art.appendChild(c);
      hero.appendChild(art);
      raiz.appendChild(hero);
      presentes.forEach(function (s) {
        var lista = ns.filter(function (n) { return n !== top && sec(n) === s; });
        if (lista.length) raiz.appendChild(seccion(s, lista));
      });
    }
    dibujar();
  }

  /* ---------- Noticia completa ---------- */
  function pintarNoticia(ns) {
    var raiz = document.getElementById('contenido');
    var id = new URLSearchParams(location.search).get('id') || '';
    var n = ns.filter(function (x) { return x.id === id; })[0];
    limpiar(raiz);
    if (!n) {
      raiz.appendChild(el('p', 'estado', 'No encontramos esta noticia. Puede que ya no esté publicada.'));
      var v = el('a', 'pill', 'Ver todas las noticias');
      v.href = '/noticias/';
      var w = el('p', 'estado');
      w.appendChild(v);
      raiz.appendChild(w);
      return;
    }
    document.title = n.titular + ' | MascoTimes';
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', n.entradilla);

    var cont = el('div', 'nota');
    var art = el('article');
    var migas = el('p', 'migas');
    var a1 = el('a', null, 'Noticias'); a1.href = '/noticias/';
    migas.appendChild(a1);
    migas.appendChild(document.createTextNode(' › ' + sec(n)));
    art.appendChild(migas);
    art.appendChild(el('span', 'kicker', sec(n)));
    art.appendChild(el('h1', null, n.titular));
    art.appendChild(el('p', 'entradilla', n.entradilla));

    var barra = el('div', 'meta-barra');
    barra.appendChild(el('span', null, 'Por la Redacción de MascoTimes · Publicado el ' + fechaLarga(n.fecha) + (hora(n.fecha) ? ', ' + hora(n.fecha) : '')));
    var acc = el('span', 'acciones');
    var cp = el('button', 'pill', 'Copiar enlace');
    cp.type = 'button';
    cp.addEventListener('click', function () {
      try { navigator.clipboard.writeText(location.href).then(function () { cp.textContent = 'Enlace copiado'; }); } catch (e) { cp.textContent = 'Copia el enlace de la barra'; }
    });
    acc.appendChild(cp);
    var wa = el('a', 'pill', 'WhatsApp');
    wa.href = 'https://wa.me/?text=' + encodeURIComponent(n.titular + ' ' + location.href);
    wa.rel = 'noopener noreferrer'; wa.target = '_blank';
    acc.appendChild(wa);
    var co = el('a', 'pill', 'Correo');
    co.href = 'mailto:?subject=' + encodeURIComponent(n.titular) + '&body=' + encodeURIComponent(location.href);
    acc.appendChild(co);
    barra.appendChild(acc);
    art.appendChild(barra);

    if (n.imagen) {
      var fig = el('div', 'foto');
      var img = el('img');
      img.alt = 'Ilustración generada con IA para: ' + n.titular;
      img.src = API + 'foto-publica?g=' + encodeURIComponent(n.id);
      img.addEventListener('error', function () { fig.remove(); pie.remove(); });
      fig.appendChild(img);
      art.appendChild(fig);
      var pie = el('p', 'pie-foto', 'Ilustración generada con IA, MascoTimes. No muestra hechos reales.');
      art.appendChild(pie);
    }

    var tx = el('div', 'texto');
    (n.cuerpo || []).forEach(function (p) { tx.appendChild(el('p', null, p)); });
    art.appendChild(tx);

    var aviso = el('p', 'aviso-vet', 'Información orientativa, no sustituye el consejo de tu veterinario. Si tu perro o tu gato tiene síntomas o dudas de salud, consulta con un profesional.');
    art.appendChild(aviso);
    cont.appendChild(art);

    var as = el('aside');
    var pf = el('div', 'panel');
    pf.appendChild(el('span', 'kicker', 'Fuentes consultadas'));
    var p1 = el('p'); p1.appendChild(el('b', null, 'Texto: ')); p1.appendChild(document.createTextNode('propio de MascoTimes, redactado con ayuda de IA a partir de la fuente y revisado por una persona.'));
    pf.appendChild(p1);
    if (n.fuente_url) {
      var p2 = el('p'); p2.appendChild(el('b', null, 'Fuente original: '));
      var l = el('a', null, dominio(n.fuente_url) || n.medio || 'ver original');
      l.href = n.fuente_url; l.rel = 'noopener noreferrer'; l.target = '_blank';
      p2.appendChild(l);
      pf.appendChild(p2);
      var bt = el('a', 'btn-fuente', 'Leer la fuente original');
      bt.href = n.fuente_url; bt.rel = 'noopener noreferrer'; bt.target = '_blank';
      pf.appendChild(bt);
    }
    var p3 = el('p'); p3.appendChild(el('b', null, 'Publicado: ')); p3.appendChild(document.createTextNode(fechaLarga(n.fecha)));
    pf.appendChild(p3);
    as.appendChild(pf);
    var otras = ns.filter(function (x) { return x.id !== n.id; }).slice(0, 4);
    if (otras.length) as.appendChild(lateral('Lo más reciente', otras));
    cont.appendChild(as);
    raiz.appendChild(cont);
  }

  cargar(function (ns) {
    if (page === 'portada') pintarPortada(ns);
    else if (page === 'listado') pintarListado(ns);
    else if (page === 'noticia') pintarNoticia(ns);
  });
})();
