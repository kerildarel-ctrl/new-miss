var C=[
{id:'miss-campus',s:'Miss',st:'En Cours',t:'Miss Campus 2026',d:'Élection de la reine du campus',c:[['Aïcha Ndongo',1240],['Brenda Mbarga',980],['Carine Fotso',760],['Dorine Essomba',410]]},
{id:'mister-campus',s:'Mister',st:'En Cours',t:'Mister Campus 2026',d:'Élection du roi du campus',c:[['Éric Tchoua',1105],['Franck Nkoulou',1020],['Gaël Biyong',690],['Hervé Atangana',350]]},
{id:'talent',s:'Talent',st:'À Venir',t:'Prix du talent',d:'Chant, danse et humour',c:[['Inès Kamga',0],['Joël Manga',0],['Kévin Owona',0]]},
{id:'miss-rentree',s:'Rentrée',st:'Terminé',t:'Miss Rentrée 2025',d:'Édition précédente',c:[['Léa Njoya',1520],['Mireille Tagne',1310],['Nadège Eto',890]]}
];
var slug=function(n){return n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')};
C.forEach(function(c){c.c.forEach(function(x){x[2]=slug(x[0])})});
var BIO={
"aicha-ndongo":"Étudiante en droit. Passionnée de danse et de théâtre, elle s'engage dans l'association culturelle du campus.",
"brenda-mbarga":"Étudiante en communication. Elle anime une émission de radio universitaire.",
"carine-fotso":"Étudiante en informatique. Sportive, elle joue au basket dans l'équipe de l'école.",
"dorine-essomba":"Étudiante en gestion. Elle crée des bijoux en perles et les vend pendant les événements du campus.",
"eric-tchoua":"Étudiant en génie civil. Capitaine de l'équipe de football de l'école.",
"franck-nkoulou":"Étudiant en économie. Président du club d'entrepreneuriat.",
"gael-biyong":"Étudiant en médecine. Bénévole dans les campagnes de sensibilisation du campus.",
"herve-atangana":"Étudiant en architecture. Dessinateur et photographe à ses heures.",
"ines-kamga":"Chanteuse dans le chœur universitaire. Elle écrit ses propres chansons.",
"joel-manga":"Danseur et chorégraphe, il anime un atelier de danse urbaine.",
"kevin-owona":"Humoriste, il fait rire le campus depuis la première année.",
"lea-njoya":"Lauréate de l'édition 2025. Étudiante en lettres modernes.",
"mireille-tagne":"Étudiante en biologie. Passionnée de lecture et de randonnée.",
"nadege-eto":"Étudiante en gestion. Bénévole dans une association de quartier."};
var bio=function(id){return BIO[id]||'Biographie à venir.'};
var lang='fr';try{lang=localStorage.getItem('mm-lang')||'fr'}catch(e){}
var T0=Date.now(),DAY=864e5,HR=36e5,dc=null;
var DT={'miss-campus':[T0-10*DAY,T0+20*DAY+3*HR],'mister-campus':[T0-12*DAY,T0+3*DAY+5*HR],'talent':[T0+6*DAY,T0+21*DAY],'miss-rentree':[T0-300*DAY,T0-30*DAY]};
function stOf(c){var n=Date.now();return n<c.start?'À Venir':n<c.end?'En Cours':'Terminé'}
C.forEach(function(c){c.start=DT[c.id][0];c.end=DT[c.id][1];c.st=stOf(c)});
var pad=function(n){return n<10?'0'+n:''+n};
function fmtCd(ms){var s=Math.max(0,Math.floor(ms/1000)),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),u=lang==='en'?'d':'j';return d>0?d+' '+u+' '+pad(h)+' h '+pad(m)+' min':pad(h)+':'+pad(m)+':'+pad(s%60)}
function dstr(ms){return new Date(ms).toLocaleDateString(lang==='en'?'en-GB':'fr-FR',{day:'numeric',month:'long',year:'numeric'})}
function cdText(c){var n=Date.now(),en=lang==='en';if(n<c.start)return (en?'Opens in ':'Ouvre dans ')+fmtCd(c.start-n);if(n<c.end)return (en?'Ends in ':'Se termine dans ')+fmtCd(c.end-n);return (en?'Closed on ':'Clôturée le ')+dstr(c.end)}
function period(c){return lang==='en'?'From '+dstr(c.start)+' to '+dstr(c.end):'Du '+dstr(c.start)+' au '+dstr(c.end)}
function updCd(){document.querySelectorAll('.cd').forEach(function(e){var c=C.find(function(x){return x.id===e.dataset.id});if(!c)return;var t=cdText(c);if(e.dataset.t)t=c.t+' · '+t;if(e.textContent!==t)e.textContent=t})}
function qrSvg(t){try{if(typeof qrcode!=='function')return '';var q=qrcode(0,'M');q.addData(t);q.make();var n=q.getModuleCount(),d='';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';return '<svg viewBox="-3 -3 '+(n+6)+' '+(n+6)+'" role="img" aria-label="QR code" shape-rendering="crispEdges"><rect x="-3" y="-3" width="'+(n+6)+'" height="'+(n+6)+'" fill="#fff"/><path d="'+d+'" fill="#17142E"/></svg>'}catch(e){return ''}}
function qrBlock(u){var s=qrSvg(u);return s?'<div class="qr"><h3>QR code du profil</h3><div class="qrb">'+s+'</div><p class="mute sm">Imprimez-le sur vos affiches : il ouvre directement ce profil.</p></div>':''}
var EN={
"Accueil":"Home","Compétitions":"Competitions","Classement":"Leaderboard","Résultats":"Results",
"La plateforme officielle de vote et d'élection en ligne pour concours de beauté et d'excellence.":"The official online voting and election platform for beauty and excellence contests.",
"Paiement Sécurisé Mobile Money":"Secure Mobile Money payment","Navigation":"Navigation","Compétitions Officielle":"Official Competitions","Classement En Direct":"Live Leaderboard","Analytiques & Résultats":"Analytics & Results","Suivez-Nous":"Follow Us","Conçu et développé par":"Designed and developed by",
"© 2026 MISS MISTER. Tous droits réservés. Fait avec ♥ pour l'excellence.":"© 2026 MISS MISTER. All rights reserved. Made with ♥ for excellence.",
"La plateforme officielle de vote en ligne":"The official online voting platform","Votre vote, votre choix, votre champion.":"Your vote, your choice, your champion.",
"Découvrez les leaders de demain, soutenez l'excellence et faites entendre votre voix en direct grâce aux paiements sécurisés Mobile Money.":"Discover tomorrow's leaders, support excellence and make your voice heard live with secure Mobile Money payments.",
"Explorer":"Explore","CRÉER MON ÉVÉNEMENT":"CREATE MY EVENT","Voir les Compétitions":"View Competitions","Les votes arrivent en direct":"Votes are coming in live",
"Candidats":"Candidates","Total Suffrages":"Total Votes","Débit Sécurisé":"Secure Debit","100% Sécurisé":"100% Secure",
"Simple, rapide et transparent":"Simple, fast and transparent","COMMENT ÇA MARCHE ?":"HOW IT WORKS","Soutenez vos candidats favoris en 4 étapes simples et sécurisées.":"Support your favourite candidates in 4 simple, secure steps.",
"Parcourez":"Browse","Explorez le catalogue des compétitions officielles et choisissez celle de votre établissement ou région.":"Explore the catalogue of official competitions and choose the one for your school or region.",
"Sélectionnez":"Select","Consultez les profils, les biographies et les photos des candidats en lice.":"View the profiles, biographies and photos of the candidates.",
"Payez par Mobile":"Pay by Mobile","Réglez en toute sécurité via Orange Money ou MTN Mobile Money.":"Pay securely with Orange Money or MTN Mobile Money.",
"Suivez en Direct":"Follow Live","Votre vote est décompté et ajouté au score du candidat instantanément !":"Your vote is counted and added to the candidate's score instantly!",
"Paiements Sécurisés & Anti-Fraude":"Secure Payments & Anti-Fraud","Vous souhaitez organiser votre propre élection ?":"Want to organise your own election?",
"Soumettez votre demande d'événement en ligne pour créer votre compétition personnalisée et recevoir vos paiements directement par Mobile Money.":"Submit your event request online to create your custom competition and receive payments directly via Mobile Money.",
"Configuration Rapide":"Quick Setup","Débit Direct Sécurisé":"Secure Direct Debit","Support 24/7":"24/7 Support","Créez votre élection dès aujourd'hui":"Create your election today",
"Le formulaire de demande arrive bientôt":"The request form is coming soon",
"Catalogue Officiel • Votez en Direct":"Official Catalogue • Vote Live","Toutes les compétitions":"All competitions",
"Parcourez les événements officiels, découvrez les enjeux et votez pour soutenir vos candidats préférés.":"Browse official events, discover what is at stake and vote to support your favourite candidates.",
"Toutes":"All","En Cours":"Ongoing","À Venir":"Upcoming","Terminé":"Finished","Voir":"View","Aucune compétition.":"No competitions.",
"Élection de la reine du campus":"Campus queen election","Élection du roi du campus":"Campus king election","Chant, danse et humour":"Singing, dancing and comedy","Édition précédente":"Previous edition",
"Prix du talent":"Talent Award","Miss Rentrée 2025":"Miss Back-to-School 2025","Rentrée":"Back-to-School",
"Voter":"Vote","Ajouter une photo":"Add a photo","Changer la photo":"Change photo","Lien du profil":"Profile link","Copier":"Copy","QR code du profil":"Profile QR code",
"Imprimez-le sur vos affiches : il ouvre directement ce profil.":"Print it on your posters: it opens this profile directly.","Biographie à venir.":"Biography coming soon.",
"Classement En Direct • Mise à Jour Instantanée":"Live Leaderboard • Instant Updates","Leaderboard officiel":"Official leaderboard",
"Suivez la course vers la victoire et découvrez la hiérarchie des candidats mise à jour instantanément.":"Follow the race to victory and see the candidate ranking updated instantly.",
"Analytiques & Résultats En Direct":"Analytics & Live Results","Résultats des votes":"Vote results",
"Visualisation graphique de la répartition des voix et des métriques de participation.":"Graphical view of vote distribution and participation metrics.",
"Moyenne par candidat":"Average per candidate","Aucun vote pour le moment.":"No votes yet.","Répartition des voix":"Vote distribution",
"Numéro Mobile Money":"Mobile Money number","Payer":"Pay","Annuler":"Cancel","Démo : aucun paiement réel n'est effectué.":"Demo: no real payment is made.",
"Entrez un numéro camerounais à 9 chiffres, par exemple 677123456.":"Enter a 9-digit Cameroonian number, for example 677123456.",
"Lien copié : partagez-le à vos amis":"Link copied: share it with your friends","Cette compétition est terminée.":"This competition is closed.",
"Étudiante en droit. Passionnée de danse et de théâtre, elle s'engage dans l'association culturelle du campus.":"Law student. Passionate about dance and theatre, she is active in the campus cultural association.",
"Étudiante en communication. Elle anime une émission de radio universitaire.":"Communication student. She hosts a university radio show.",
"Étudiante en informatique. Sportive, elle joue au basket dans l'équipe de l'école.":"Computer science student. Sporty, she plays basketball for the school team.",
"Étudiante en gestion. Elle crée des bijoux en perles et les vend pendant les événements du campus.":"Management student. She makes beaded jewellery and sells it at campus events.",
"Étudiant en génie civil. Capitaine de l'équipe de football de l'école.":"Civil engineering student. Captain of the school football team.",
"Étudiant en économie. Président du club d'entrepreneuriat.":"Economics student. President of the entrepreneurship club.",
"Étudiant en médecine. Bénévole dans les campagnes de sensibilisation du campus.":"Medical student. Volunteer in campus awareness campaigns.",
"Étudiant en architecture. Dessinateur et photographe à ses heures.":"Architecture student. Draughtsman and part-time photographer.",
"Chanteuse dans le chœur universitaire. Elle écrit ses propres chansons.":"Singer in the university choir. She writes her own songs.",
"Danseur et chorégraphe, il anime un atelier de danse urbaine.":"Dancer and choreographer, he leads an urban dance workshop.",
"Humoriste, il fait rire le campus depuis la première année.":"Comedian, he has been making the campus laugh since first year.",
"Lauréate de l'édition 2025. Étudiante en lettres modernes.":"2025 edition winner. Modern literature student.",
"Étudiante en biologie. Passionnée de lecture et de randonnée.":"Biology student. Passionate about reading and hiking.",
"Étudiante en gestion. Bénévole dans une association de quartier.":"Management student. Volunteer in a neighbourhood association."};
function ord(n){var s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
var RX=[
[/^(\d+)er$/,function(m){return ord(+m[1])}],[/^(\d+)e$/,function(m){return ord(+m[1])}],
[/^ÉTAPE (\d+)$/,function(m){return 'STEP '+m[1]}],[/^Candidat n°(\d+)$/,function(m){return 'Candidate no. '+m[1]}],
[/^Voter pour (.+)$/,function(m){return 'Vote for '+m[1]}],[/^(.+) candidats$/,function(m){return m[1]+' candidates'}],
[/^‹ (.+)$/,function(m){return '‹ '+trp(m[1])}],[/^· (.+)$/,function(m){return '· '+trp(m[1])}],
[/^Paiement confirmé : (\d+) votes? pour (.+)$/,function(m){return 'Payment confirmed: '+m[1]+(m[1]==='1'?' vote':' votes')+' for '+m[2]}],
[/^(.+) vient de recevoir (\d+) votes?$/,function(m){return m[1]+' just received '+m[2]+(m[2]==='1'?' vote':' votes')}],
[/^(.+) : compétition clôturée$/,function(m){return m[1]+': competition closed'}],[/^(.+) : compétition ouverte$/,function(m){return m[1]+': competition open'}]];
function trp(p){if(EN[p]!==undefined)return EN[p];for(var i=0;i<RX.length;i++){var m=p.match(RX[i][0]);if(m)return RX[i][1](m)}return p}
function tr(s){var core=s.trim();if(!core)return s;return s.replace(core,core.split(' · ').map(trp).join(' · '))}
function trNode(n){if(n.__o===undefined)n.__o=n.nodeValue;var v=lang==='en'?tr(n.__o):n.__o;if(n.nodeValue!==v)n.nodeValue=v}
function applyLang(root){if(root.nodeType===3){trNode(root);return}if(root.nodeType!==1)return;
var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;while(n=w.nextNode()){var pn=n.parentNode.nodeName;if(pn!=='SCRIPT'&&pn!=='STYLE')trNode(n)}
var els=[].slice.call(root.querySelectorAll('[aria-label],[placeholder]'));els.push(root);
els.forEach(function(e){['aria-label','placeholder'].forEach(function(a){if(!e.hasAttribute||!e.hasAttribute(a))return;var k='__o_'+a;if(e[k]===undefined)e[k]=e.getAttribute(a);var v=lang==='en'?tr(e[k]):e[k];if(e.getAttribute(a)!==v)e.setAttribute(a,v)})})}
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){applyLang(n)})});updCd()}).observe(document.body,{childList:true,subtree:true});
function setLang(){lang=lang==='fr'?'en':'fr';try{localStorage.setItem('mm-lang',lang)}catch(e){}
$('#lgb').textContent=lang==='fr'?'EN':'FR';document.documentElement.lang=lang;
document.title=lang==='en'?'MISS MISTER — Your vote, your choice, your champion':'MISS MISTER — Votre vote, votre choix, votre champion';
if($('#dlg').open)$('#dlg').close();applyLang(document.body);var y=window.scrollY;route();window.scrollTo(0,y)}
setInterval(function(){var ch=null;C.forEach(function(c){var ns=stOf(c);if(ns!==c.st){c.st=ns;ch=c}});
if(ch){if(dc===ch.id&&$('#dlg').open&&!live(ch))$('#dlg').close();toast(ch.t+(live(ch)?' : compétition ouverte':' : compétition clôturée'));var y=window.scrollY;route();window.scrollTo(0,y)}
updCd()},1000);

var photos={};try{photos=JSON.parse(localStorage.getItem('eclat-ph')||'{}')}catch(e){photos={}}
var $=function(s){return document.querySelector(s)},app=$('#app'),rs=-1,rr=0,gf='all',cf='Toutes',reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
var fmt=function(n){return n.toLocaleString('fr-FR')};
var tot=function(c){return c.c.reduce(function(a,x){return a+x[1]},0)};
var sorted=function(c){return c.c.map(function(x,i){return{n:x[0],v:x[1],i:i,id:x[2],c:c}}).sort(function(a,b){return b.v-a.v})};
var ini=function(n){return n.split(' ').map(function(w){return w[0]}).join('').slice(0,2)};
var rkl=function(i){return i===0?'1er':(i+1)+'e'};
var live=function(c){return c.st==='En Cours'};
var W=function(h){return '<div class="w">'+h+'</div>'},WD=function(h){return '<div class="wd">'+h+'</div>'};
function find(id){for(var a=0;a<C.length;a++)for(var i=0;i<C[a].c.length;i++)if(C[a].c[i][2]===id)return{c:C[a],i:i,x:C[a].c[i]};return null}
var link=function(id){return location.href.split('#')[0]+'#/candidat/'+id};
var BG=['#E4DEFF','#FFDCE5','#D7D2FA','#EDE9FF'],FG=['#5B3DF5','#E0436A','#2B1A9E','#7A66F0'];
function pic(id,n){if(photos[id])return '<img alt="'+n+'" src="'+photos[id]+'">';var j=n.length%4;return '<svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+n+'"><rect width="100" height="125" fill="'+BG[j]+'"/><circle cx="50" cy="50" r="20" fill="'+FG[j]+'"/><path d="M10 125c0-30 18-46 40-46s40 16 40 46z" fill="'+FG[j]+'"/></svg>'}
var thumb=function(id,n){return '<div class="pa">'+pic(id,n)+'</div>'};
var vbtn=function(c,i){return live(c)?'<button class="btn sm" onclick="vote(\''+c.id+'\','+i+')">Voter</button>':'<span class="mute sm">'+c.st+'</span>'};
function card(id){var f=find(id),s=sorted(f.c),p=s.findIndex(function(y){return y.i===f.i});
return '<a class="cc" href="#/candidat/'+id+'"><div class="ph">'+pic(id,f.x[0])+'<em'+(p===0&&f.x[1]>0?' class="one"':'')+'>'+rkl(p)+'</em><button class="shr" aria-label="Copier le lien de '+f.x[0]+'" onclick="copyLink(\''+id+'\',event)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 13v7h14v-7"/></svg></button></div><h3>'+f.x[0]+'</h3><span class="mute sm">'+fmt(f.x[1])+' votes · '+f.c.s+'</span></a>'}
function galHTML(){var o='';C.forEach(function(c){if(gf==='all'||gf===c.id)sorted(c).forEach(function(x){o+=card(x.id)})});return o}
function setF(v,b){gf=v;document.querySelectorAll('.fl button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});$('#gal').innerHTML=galHTML()}
function copyLink(id,ev){if(ev){ev.preventDefault();ev.stopPropagation()}var u=link(id);function ok(){toast('Lien copié : partagez-le à vos amis')}function fb(){var t=document.createElement('input');t.value=u;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(e){toast(u)}t.remove()}
try{navigator.clipboard.writeText(u).then(ok,fb)}catch(e){fb()}}
function nshare(id){navigator.share({title:'MISS MISTER',text:'Votez pour '+find(id).x[0],url:link(id)}).catch(function(){})}
function upl(id,inp){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var k=Math.min(1,480/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=im.width*k;cv.height=im.height*k;cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);photos[id]=cv.toDataURL('image/jpeg',.82);try{localStorage.setItem('eclat-ph',JSON.stringify(photos))}catch(e){}cand(id)};im.src=r.result};r.readAsDataURL(f)}
function fill(){requestAnimationFrame(function(){requestAnimationFrame(function(){document.querySelectorAll('[data-w]').forEach(function(e){e.style.width=e.dataset.w+'%'})})})}
function tilt(e,el){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform='rotateX('+(-y*10)+'deg) rotateY('+(x*12)+'deg)'}
var stc={'En Cours':'','À Venir':' av','Terminé':' te'};
function cl(){var l=C.filter(function(c){return cf==='Toutes'||c.st===cf});if(!l.length)return '<p class="mute">Aucune compétition.</p>';return '<div class="tiles">'+l.map(function(c){return '<a class="tile" href="#/c/'+c.id+'" onpointermove="tilt(event,this)" onpointerleave="this.style.transform=\'\'"><span class="chip z'+stc[c.st]+'">'+c.st+'</span><h3 class="z" style="font-size:1.2rem">'+c.t+'</h3><div class="mute sm z">'+c.d+'</div><div class="cdl z"><span class="cd" data-id="'+c.id+'"></span></div><div class="faces z">'+sorted(c).slice(0,4).map(function(x){return thumb(x.id,x.n)}).join('')+'</div><div class="go z"><span>'+c.c.length+' candidats · '+fmt(tot(c))+' votes</span><span>Voir</span></div></a>'}).join('')+'</div>'}
function setC(v,b){cf=v;document.querySelectorAll('#ct button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});$('#cl').innerHTML=cl()}
function rows(c){var s=sorted(c),m=s[0].v||1;return s.map(function(x,k){return '<div class="rk"><span class="n">'+(k+1)+'</span>'+thumb(x.id,x.n)+'<div><a href="#/candidat/'+x.id+'">'+x.n+'</a><div class="m"><i data-w="'+Math.round(x.v/m*100)+'"></i></div><span class="mute sm">'+fmt(x.v)+' votes</span></div>'+vbtn(c,x.i)+'</div>'}).join('')}
function home(){gf='all';var nc=C.reduce(function(a,c){return a+c.c.length},0),tv=C.reduce(function(a,c){return a+tot(c)},0);
app.innerHTML='<section class="hero" style="padding:0"><div class="wd"><div class="ht"><p class="eb">La plateforme officielle de vote en ligne</p><h1>Miss Mister</h1><div class="tg">Votre vote, votre choix, votre champion.</div><p>Découvrez les leaders de demain, soutenez l\'excellence et faites entendre votre voix en direct grâce aux paiements sécurisés Mobile Money.</p><div class="row"><a class="btn wh" href="#/competitions">Explorer</a><button class="btn ow" onclick="toast(\'Le formulaire de demande arrive bientôt\')">CRÉER MON ÉVÉNEMENT</button></div><div class="lk"><a href="#/competitions">Voir les Compétitions</a><a href="#/classement">Classement</a></div></div></div></section>'
+'<div class="wd"><div class="stats"><div><b>'+C.length+'</b>Compétitions</div><div><b>'+nc+'</b>Candidats</div><div><b>'+fmt(tv)+' votes</b>Total Suffrages</div><div><b>Mobile Money</b>Débit Sécurisé · 100% Sécurisé</div></div></div>'
+'<section class="sec">'+WD('<p class="eb">Simple, rapide et transparent</p><h2>COMMENT ÇA MARCHE ?</h2><p class="lead">Soutenez vos candidats favoris en 4 étapes simples et sécurisées.</p><div class="steps"><div><small>ÉTAPE 01</small><h3>Parcourez</h3><p>Explorez le catalogue des compétitions officielles et choisissez celle de votre établissement ou région.</p></div><div><small>ÉTAPE 02</small><h3>Sélectionnez</h3><p>Consultez les profils, les biographies et les photos des candidats en lice.</p></div><div><small>ÉTAPE 03</small><h3>Payez par Mobile</h3><p>Réglez en toute sécurité via Orange Money ou MTN Mobile Money.</p></div><div><small>ÉTAPE 04</small><h3>Suivez en Direct</h3><p>Votre vote est décompté et ajouté au score du candidat instantanément !</p></div></div>')+'</section>'
+'<section class="cta" style="padding:0"><div class="wd"><p class="eb">Paiements Sécurisés &amp; Anti-Fraude</p><h2>Vous souhaitez organiser votre propre élection ?</h2><p>Soumettez votre demande d\'événement en ligne pour créer votre compétition personnalisée et recevoir vos paiements directement par Mobile Money.</p><ul><li>Configuration Rapide</li><li>Débit Direct Sécurisé</li><li>Support 24/7</li></ul><h4>Créez votre élection dès aujourd\'hui</h4><button class="btn wh" onclick="toast(\'Le formulaire de demande arrive bientôt\')">CRÉER MON ÉVÉNEMENT</button></div></section>';fill()}
function comps(){cf='Toutes';app.innerHTML='<section class="pg">'+WD('<p class="eb">Catalogue Officiel • Votez en Direct</p><h1 class="pt">Toutes les compétitions</h1><p class="lead">Parcourez les événements officiels, découvrez les enjeux et votez pour soutenir vos candidats préférés.</p><div class="fl" id="ct">'+['Toutes','En Cours','À Venir','Terminé'].map(function(v,i){return '<button aria-pressed="'+(i===0)+'" onclick="setC(\''+v+'\',this)">'+v+'</button>'}).join('')+'</div><div id="cl">'+cl()+'</div>')+'</section>'}
function comp(id){var c=C.find(function(x){return x.id===id});if(!c)return home();
app.innerHTML='<section class="pg">'+WD('<a class="crumb" href="#/competitions">‹ Compétitions</a><h1 class="pt" style="margin-top:10px">'+c.t+'</h1><p class="mute" style="margin:6px 0 0">'+c.st+' · '+c.d+' · '+fmt(tot(c))+' votes</p><div class="cdp"><span class="cd" data-id="'+c.id+'"></span><span class="mute">'+period(c)+'</span></div><div class="pcs">'+sorted(c).map(function(x,k){return '<div class="pc"><a href="#/candidat/'+x.id+'"><div class="ph">'+pic(x.id,x.n)+'<em'+(k===0&&x.v>0?' class="one"':'')+'>'+rkl(k)+'</em></div><h3>'+x.n+'</h3><p class="bio">'+bio(x.id)+'</p><p class="vt">'+fmt(x.v)+' votes</p></a>'+(live(c)?'<button class="btn full" data-c="'+c.id+'" data-i="'+x.i+'" onclick="vote(this.dataset.c,+this.dataset.i)">Voter · 100 FCFA</button>':'<button class="btn full" disabled>'+c.st+'</button>')+'</div>'}).join('')+'</div>')+'</section>';fill()}
function cand(id){var f=find(id);if(!f)return home();var c=f.c,x=f.x,i=f.i,s=sorted(c),p=s.findIndex(function(y){return y.i===i}),u=link(id),m=s[0].v||1;
app.innerHTML='<section class="pg">'+WD('<a class="crumb" href="#/c/'+c.id+'">‹ '+c.t+'</a><div class="pr"><div><div class="ph pf">'+pic(id,x[0])+'<em'+(p===0&&x[1]>0?' class="one"':'')+'>'+rkl(p)+'</em></div><label class="btn sm line" style="margin-top:12px;cursor:pointer">'+(photos[id]?'Changer la photo':'Ajouter une photo')+'<input type="file" accept="image/*" hidden data-id="'+id+'" onchange="upl(this.dataset.id,this)"></label></div><div><h1 class="pt" style="margin-top:0">'+x[0]+'</h1><p class="mute" style="margin:6px 0 0">Candidat n°'+(i+1)+' · '+c.t+' · '+c.st+'</p><div class="cdp"><span class="cd" data-id="'+c.id+'"></span></div><p style="margin:14px 0 0">'+bio(id)+'</p><div class="big">'+fmt(x[1])+' <small>votes</small></div><div class="m"><i data-w="'+Math.round(x[1]/m*100)+'"></i></div><h3 style="margin-top:30px">Lien du profil</h3><div class="sb"><input readonly value="'+u+'" onclick="this.select()" aria-label="Lien du profil"><button class="btn sm" data-id="'+id+'" onclick="copyLink(this.dataset.id)">Copier</button></div>'+qrBlock(u)+'<div style="margin-top:32px">'+(live(c)?'<button class="btn full" data-c="'+c.id+'" data-i="'+i+'" onclick="vote(this.dataset.c,+this.dataset.i)">Voter · 100 FCFA</button>':'<button class="btn full" disabled>'+c.st+'</button>')+'</div></div></div>')+'</section>';fill()}
function tabs(arr,cur,fn){return '<div class="fl">'+arr.map(function(t,k){return '<button aria-pressed="'+(k===cur)+'" onclick="'+fn+'('+(fn==='rkSet'?k-1:k)+')">'+t+'</button>'}).join('')+'</div>'}
function rkSet(k){rs=k;rank()}
function rank(){var all=[];C.forEach(function(c,ci){if(rs===-1||rs===ci)sorted(c).forEach(function(x){all.push(x)})});all.sort(function(a,b){return b.v-a.v});var m=all[0]?all[0].v||1:1;
app.innerHTML='<section class="pg">'+WD('<p class="eb">Classement En Direct • Mise à Jour Instantanée</p><h1 class="pt">Leaderboard officiel</h1><p class="lead">Suivez la course vers la victoire et découvrez la hiérarchie des candidats mise à jour instantanément.</p>'+tabs(['Toutes'].concat(C.map(function(c){return c.s})),rs+1,'rkSet')+'<div class="rkg">'+all.map(function(x,k){return '<div class="rk"><span class="n">'+(k+1)+'</span>'+thumb(x.id,x.n)+'<div><a href="#/candidat/'+x.id+'">'+x.n+'</a> <span class="mute sm">· '+x.c.s+'</span><div class="m"><i data-w="'+Math.round(x.v/m*100)+'"></i></div><span class="mute sm">'+fmt(x.v)+' votes</span></div>'+vbtn(x.c,x.i)+'</div>'}).join('')+'</div>')+'</section>';fill()}
var DC=['#5B3DF5','#FF5A7E','#2B1A9E','#B5A9FF'];
function resSet(k){rr=k;res()}
function res(){var c=C[rr],s=sorted(c),t=tot(c),off=0;
var d=t?'<svg viewBox="0 0 42 42" role="img" aria-label="Répartition des voix"><circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--line)" stroke-width="6"/>'+s.map(function(x,k){var p=x.v/t*100,o='<circle cx="21" cy="21" r="15.915" fill="none" stroke="'+DC[k%4]+'" stroke-width="6" stroke-dasharray="'+p+' '+(100-p)+'" stroke-dashoffset="'+(25-off)+'"/>';off+=p;return o}).join('')+'<text x="21" y="22.5" text-anchor="middle" font-size="5.2" font-weight="800" fill="var(--ink)" font-family="Poppins,sans-serif">'+fmt(t)+'</text></svg>':'<p class="mute">Aucun vote pour le moment.</p>';
app.innerHTML='<section class="pg">'+WD('<p class="eb">Analytiques &amp; Résultats En Direct</p><h1 class="pt">Résultats des votes</h1><p class="lead">Visualisation graphique de la répartition des voix et des métriques de participation.</p>'+tabs(C.map(function(x){return x.t}),rr,'resSet')+'<div class="don"><div>'+d+'</div><div>'+s.map(function(x,k){return '<div class="lg"><i style="background:'+DC[k%4]+'"></i><span>'+x.n+'</span><span class="mute">'+(t?Math.round(x.v/t*100):0)+'%</span><b>'+fmt(x.v)+'</b></div>'}).join('')+'</div></div><div class="met"><div><b>'+fmt(t)+' votes</b>Total Suffrages</div><div><b>'+c.c.length+'</b>Candidats</div><div><b>'+fmt(Math.round(t/c.c.length))+'</b>Moyenne par candidat</div></div>')+'</section>'}
function route(){var h=location.hash.replace('#/','').split('/'),r=h[0]||'',a=r===''?'home':(r==='c'||r==='competitions'||r==='candidat')?'comps':r==='classement'?'rank':'res';
document.querySelectorAll('nav a').forEach(function(l){l.classList.toggle('on',l.dataset.r===a)});
if(r==='competitions')comps();else if(r==='c')comp(h[1]);else if(r==='candidat')cand(h[1]);else if(r==='classement')rank();else if(r==='resultats')res();else home();window.scrollTo(0,0)}
addEventListener('hashchange',route);
var q=1,op='Orange Money';
function vote(id,i){var c=C.find(function(x){return x.id===id}),n=c.c[i][0],d=$('#dlg');q=1;
d.innerHTML='<h3 style="font-size:1.15rem">Voter pour '+n+'</h3><div class="mute sm">'+c.t+'</div><div class="ch" id="qs">'+[1,5,10,20].map(function(k){return '<button type="button" data-q="'+k+'" aria-pressed="'+(k===q)+'">'+k+(k>1?' votes':' vote')+'</button>'}).join('')+'</div><div class="ch" id="ops">'+[['Orange Money','#FF7900'],['MTN MoMo','#FFCC00']].map(function(o){return '<button type="button" data-o="'+o[0]+'" aria-pressed="'+(o[0]===op)+'"><i style="background:'+o[1]+'"></i>'+o[0]+'</button>'}).join('')+'</div><label for="ph">Numéro Mobile Money</label><input id="ph" inputmode="tel" placeholder="6 77 12 34 56" autocomplete="tel"><p class="err" id="er"></p><div class="tot"><span>Total</span><span id="tt">100 FCFA</span></div><div style="display:flex;gap:10px"><button class="btn" id="pay" style="flex:1">Payer</button><button class="btn line" id="no">Annuler</button></div><p class="mute" style="font-size:.78rem;margin:12px 0 0">Démo : aucun paiement réel n\'est effectué.</p>';
dc=id;d.showModal();
$('#qs').onclick=function(e){var b=e.target.closest('[data-q]');if(!b)return;q=+b.dataset.q;[].forEach.call(this.children,function(x){x.setAttribute('aria-pressed',x===b)});$('#tt').textContent=fmt(q*100)+' FCFA'};
$('#ops').onclick=function(e){var b=e.target.closest('[data-o]');if(!b)return;op=b.dataset.o;[].forEach.call(this.children,function(x){x.setAttribute('aria-pressed',x===b)})};
$('#no').onclick=function(){d.close()};
$('#pay').onclick=function(){var p=$('#ph').value.replace(/\D/g,'').replace(/^237/,'');if(!/^6\d{8}$/.test(p)){$('#er').textContent='Entrez un numéro camerounais à 9 chiffres, par exemple 677123456.';return}
if(!live(c)){d.close();toast('Cette compétition est terminée.');return}c.c[i][1]+=q;d.close();toast('Paiement confirmé : '+q+(q>1?' votes':' vote')+' pour '+n);var y=window.scrollY;route();window.scrollTo(0,y)}}
var tm;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('on')},3200)}
route();
$('#lgb').textContent=lang==='fr'?'EN':'FR';if(lang==='en'){document.documentElement.lang='en';document.title='MISS MISTER — Your vote, your choice, your champion';applyLang(document.body)}
