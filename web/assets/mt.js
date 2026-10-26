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
  function etiqueta(c) { return c === 'Estudios' ? 'Ciencia' : (c || 'Noticias'); }
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

  function foto(n, alto) {
    var fig = el('a', 'foto');
    fig.href = urlNoticia(n);
    fig.setAttribute('aria-label', n.titular);
    if (n.imagen) {
      var img = el('img');
      img.loading = alto ? 'eager' : 'lazy';
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

  function tarjeta(n) {
    var t = el('article', 'tarjeta');
    t.appendChild(foto(n));
    var c = el('div', 'cuerpo');
    c.appendChild(el('span', 'kicker', etiqueta(n.categoria)));
    c.appendChild(enlaceTitulo('h3', n));
    c.appendChild(el('p', null, n.entradilla));
    t.appendChild(c);
    return t;
  }

  function lateral(titulo, lista) {
    var p = el('div', 'panel');
    p.appendChild(el('span', 'kicker', titulo));
    lista.forEach(function (n) {
      var d = el('p', 'lista-i');
      var a = el('a', null, n.titular);
      a.href = urlNoticia(n);
      d.appendChild(a);
      d.appendChild(el('small', null, etiqueta(n.categoria) + ' · ' + fechaLarga(n.fecha)));
      p.appendChild(d);
    });
    return p;
  }

  function grande(n) {
    var d = el('article', 'grande');
    d.appendChild(foto(n, true));
    var c = el('div');
    var k = el('span', 'kicker', 'Portada del día · ' + etiqueta(n.categoria));
    k.className = 'kicker';
    c.appendChild(k);
    c.appendChild(enlaceTitulo('h2', n));
    c.appendChild(el('p', null, n.entradilla));
    c.appendChild(el('span', 'autor', 'Por la Redacción de MascoTimes · Fuente original enlazada en la noticia'));
    d.appendChild(c);
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

  /* ---------- Portada ---------- */
  function pintarPortada(ns) {
    var raiz = document.getElementById('contenido');
    limpiar(raiz);
    if (!ns.length) { raiz.appendChild(el('p', 'estado', 'Hoy todavía no hay noticias. Vuelve pronto.')); return; }
    var hero = el('section', 'hero');
    hero.appendChild(grande(ns[0]));
    var as = el('aside');
    as.appendChild(lateral('Última hora', ns.slice(1, 5)));
    hero.appendChild(as);
    raiz.appendChild(hero);

    var t1 = el('div', 'sec-t');
    t1.appendChild(el('h2', null, 'Más noticias de hoy'));
    var ver = el('a', null, 'Ver todas');
    ver.href = '/noticias/';
    t1.appendChild(ver);
    raiz.appendChild(t1);
    var rej = el('div', 'rejilla');
    ns.slice(5, 11).forEach(function (n) { rej.appendChild(tarjeta(n)); });
    raiz.appendChild(rej);
  }

  /* ---------- Listado de noticias ---------- */
  function pintarListado(ns) {
    var raiz = document.getElementById('contenido');
    var filtro = '';
    function dibujar() {
      limpiar(raiz);
      var vis = ns.filter(function (n) { return !filtro || n.categoria === filtro; });
      if (!vis.length) { raiz.appendChild(el('p', 'estado', 'Todavía no hay noticias en este tema. Vuelve pronto.')); return; }
      var hero = el('section', 'hero');
      hero.appendChild(grande(vis[0]));
      var as = el('aside');
      if (vis.length > 1) as.appendChild(lateral('Lo más reciente', vis.slice(1, 5)));
      hero.appendChild(as);
      raiz.appendChild(hero);
      if (vis.length > 5) {
        var t = el('div', 'sec-t');
        t.appendChild(el('h2', null, filtro ? etiqueta(filtro) : 'Todas las noticias'));
        raiz.appendChild(t);
        var rej = el('div', 'rejilla');
        vis.slice(5).forEach(function (n) { rej.appendChild(tarjeta(n)); });
        raiz.appendChild(rej);
      }
    }
    document.querySelectorAll('.filtros button').forEach(function (b) {
      b.addEventListener('click', function () {
        filtro = b.getAttribute('data-f');
        document.querySelectorAll('.filtros button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        dibujar();
      });
    });
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
    migas.appendChild(document.createTextNode(' › ' + etiqueta(n.categoria)));
    art.appendChild(migas);
    art.appendChild(el('span', 'kicker', etiqueta(n.categoria)));
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
