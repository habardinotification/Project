import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Phone, Mail, MapPin, Globe2, Menu, X, Truck, HardHat, Mountain, Star, CheckCircle2, Send, Image as ImageIcon } from 'lucide-react';
import './styles.css';
import logo from './assets/logo.png';
import founder from './assets/founder.png';

const media = {
  hero: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=85',
  crusher: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1400&q=85',
  excavator: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=85',
  truck: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=85',
  loader: 'https://images.unsplash.com/photo-1564182842519-8a3b2af3e228?auto=format&fit=crop&w=1200&q=85',
  road: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85',
  p34: 'https://www.arkanaltatweer.com/wp-content/uploads/2025/01/%D8%A8%D8%AD%D8%B5.jpg',
  p38: 'https://www.arkanaltatweer.com/wp-content/uploads/2024/12/3-8.jpg',
  p316: 'https://www.arkanaltatweer.com/wp-content/uploads/2024/12/3-16.jpg',
  washed: 'https://postcdn.haraj.com.sa/userfiles30/2022-08-31/675x900_32246D8B-37E9-4D64-B07E-9CA1651C9C3D.jpg-700.webp',
  a1b: 'https://mimg6cdn.haraj.com.sa/userfiles30/2026-4-2/1080x1045-1_-mkJczTa5qb2a4n.jpg',
  powder: 'https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=1200&q=85'
};

const dict = {
  ar: {
    dir: 'rtl', switch: 'EN', topLocation: 'المملكة العربية السعودية - طريق الصمان',
    brand: 'مجموعة شركات زرعة الخير', sub: 'قسم إدارة النقليات والكسارة',
    nav: ['الرئيسية','من نحن','منتجاتنا','الأسطول','المعرض','طلب عرض سعر','تواصل معنا'],
    heroKicker: 'حلول متكاملة للنقليات والكسارات',
    heroTitle: 'توريد موثوق للبحص وتشغيل احترافي للنقليات',
    heroText: 'نخدم مشاريع البنية التحتية والمقاولات عبر مواد كسارة عالية الجودة، وأسـطول نقل وتجهيزات تشغيلية جاهزة للاستجابة السريعة في مواقع العمل.',
    ctaQuote: 'طلب عرض سعر', ctaGallery: 'مشاهدة المعرض',
    features: ['التزام بالمواعيد','أسطول ومعدات حديثة','جودة مواد مضمونة'],
    aboutKicker: 'من نحن', aboutTitle: 'خبرة تقود مشاريع الطرق والبنية التحتية بثقة',
    founderRole: 'المؤسس والمدير العام', founderName: 'السيد الدكتور / عسيكر بن فهيد الحبردي',
    founderText: 'يقود مجموعة شركات زرعة الخير السيد الدكتور / عسيكر بن فهيد الحبردي، بخبرة طويلة في قطاع النقل والتعدين، حيث أسس المجموعة لتكون ركيزة أساسية في دعم مشاريع البنية التحتية بالمملكة، مع التركيز على الجودة والالتزام والاحترافية.',
    aboutText: 'تعمل المجموعة من خلال قسم متخصص في إدارة النقليات والكسارة لتوفير حلول عملية تشمل إنتاج البحص، توريد المواد، وتشغيل أسطول النقل لخدمة المشاريع بأعلى مستوى من التنظيم والمتابعة.',
    productsKicker: 'منتجاتنا', productsTitle: 'مقاسات البحص التي تنتجها الكسارة', productsNote: 'أفضل أنواع البحص والبودرة والرمل بجودة عالية، ومناسبة لأعمال الخرسانة والطرق والردم والتسوية.',
    fleetKicker: 'الأسطول', fleetTitle: 'معدات وأسـطول جاهز لخدمة المشروع', fleetText: 'نربط الإنتاج بالتوريد من خلال معدات ثقيلة ومركبات نقل تساعد على إنجاز الطلبات بكفاءة وانتظام.',
    galleryKicker: 'معرض الصور', galleryTitle: 'صور مختارة للمنتجات والمعدات وبيئة العمل', all: 'الكل', crusher: 'الكسارة', fleet: 'الأسطول', products: 'المنتجات',
    testimonialsKicker: 'آراء العملاء', testimonialsTitle: 'ثقة مبنية على الالتزام وجودة التوريد',
    quoteKicker: 'طلب عرض سعر', quoteTitle: 'أرسل بيانات التوريد وسنتواصل معك', quoteText: 'النموذج جاهز للاستقبال المبدئي ويمكن ربطه لاحقاً بالبريد أو واتساب أو أي نظام إدارة طلبات.',
    form: { name: 'الاسم', phone: 'رقم الجوال', material: 'المادة المطلوبة', quantity: 'الكمية التقريبية', location: 'موقع التوريد', message: 'تفاصيل إضافية', submit: 'إرسال الطلب' },
    contact: 'تواصل معنا', footer: 'جميع الحقوق محفوظة © مجموعة شركات زرعة الخير - قسم إدارة النقليات والكسارة'
  },
  en: {
    dir: 'ltr', switch: 'AR', topLocation: 'Kingdom of Saudi Arabia - Al-Summan Road',
    brand: 'Zarat Alkhair Group', sub: 'Transportation & Crusher Management',
    nav: ['Home','About','Products','Fleet','Gallery','Request Quote','Contact'],
    heroKicker: 'Integrated transportation and crusher solutions',
    heroTitle: 'Reliable aggregate supply and professional transport operations',
    heroText: 'We support infrastructure and contracting projects through high-quality crusher materials, organized transportation, and operational readiness for fast response at project sites.',
    ctaQuote: 'Request Quote', ctaGallery: 'View Gallery',
    features: ['On-time delivery','Modern fleet and equipment','Guaranteed material quality'],
    aboutKicker: 'About Us', aboutTitle: 'Experience supporting road and infrastructure projects with confidence',
    founderRole: 'Founder & General Manager', founderName: 'Dr. Aseeker bin Fahid Al-Habardi',
    founderText: 'Zarat Alkhair Group is led by Dr. Aseeker bin Fahid Al-Habardi, a highly experienced leader in transportation and mining. He founded the group to support infrastructure projects across the Kingdom with a strong focus on quality, commitment, and professionalism.',
    aboutText: 'The group operates through a specialized transportation and crusher management division, providing aggregate production, material supply, and fleet operations with organized follow-up and reliable execution.',
    productsKicker: 'Products', productsTitle: 'Crusher aggregate sizes', productsNote: 'High-quality aggregate, powder, and sand products suitable for concrete, roads, backfilling, and leveling works.',
    fleetKicker: 'Fleet', fleetTitle: 'Equipment and fleet ready for project delivery', fleetText: 'We connect production with supply through heavy equipment and transport vehicles that keep deliveries efficient and organized.',
    galleryKicker: 'Gallery', galleryTitle: 'Selected photos of products, equipment, and operations', all: 'All', crusher: 'Crusher', fleet: 'Fleet', products: 'Products',
    testimonialsKicker: 'Testimonials', testimonialsTitle: 'Trust built on commitment and supply quality',
    quoteKicker: 'Request Quote', quoteTitle: 'Send your supply details and we will contact you', quoteText: 'The form is ready for initial requests and can later be connected to email, WhatsApp, or any order management system.',
    form: { name: 'Name', phone: 'Phone number', material: 'Required material', quantity: 'Approx. quantity', location: 'Supply location', message: 'Additional details', submit: 'Submit Request' },
    contact: 'Contact', footer: 'All rights reserved © Zarat Alkhair Group - Transportation & Crusher Management'
  }
};

const productData = [
  { key: '3/4', ar: 'بحص 3/4 بوصة', en: '3/4 Aggregate', arDesc: 'مقاس 22-16 مم، يستخدم في الخرسانة الجاهزة والأساسات.', enDesc: 'Size 22-16 mm, used for ready-mix concrete and foundations.', img: media.p34 },
  { key: '3/8', ar: 'بحص 3/8 بوصة', en: '3/8 Aggregate', arDesc: 'مقاس 15-7 مم، مثالي للخرسانة الخفيفة والبلاط.', enDesc: 'Size 15-7 mm, ideal for light concrete and tiles.', img: media.p38 },
  { key: '3/16', ar: 'بحص 3/16 بوصة', en: '3/16 Aggregate', arDesc: 'مقاس 7-2 مم، يستخدم في أعمال اللياسة والبياض.', enDesc: 'Size 7-2 mm, used in plastering and finishing works.', img: media.p316 },
  { key: 'washed', ar: 'بحص مغسول', en: 'Washed Aggregate', arDesc: 'خالي من الأتربة والشوائب للخرسانة عالية الجودة.', enDesc: 'Free from dust and impurities for high-quality concrete.', img: media.washed },
  { key: 'powder', ar: 'بودرة كسارة', en: 'Crusher Powder', arDesc: 'ناعمة جداً للردم والتسوية وصناعة البلاط.', enDesc: 'Fine material for backfilling, leveling, and tile works.', img: media.powder },
  { key: 'a1b', ar: 'A1B', en: 'A1B Material', arDesc: 'مادة مناسبة لأعمال الطرق والدفان والتأسيس.', enDesc: 'Suitable for roads, backfilling, and base works.', img: media.a1b }
];

const fleetData = [
  { ar: 'تريلات وقـلابات', en: 'Trailers & Dump Trucks', img: media.truck },
  { ar: 'حفارات', en: 'Excavators', img: media.excavator },
  { ar: 'شيولات', en: 'Loaders', img: media.loader },
  { ar: 'معدات كسارة', en: 'Crusher Equipment', img: media.crusher }
];

const testimonials = [
  ['تعامل احترافي والتزام عالي بالمواعيد.', 'Professional service with strong deadline commitment.'],
  ['جودة المواد ممتازة ومناسبة لأعمال المشاريع.', 'Excellent material quality suitable for project work.'],
  ['أسطول قوي وسرعة واضحة في تنفيذ الطلبات.', 'Strong fleet with fast and organized execution.']
];

function App() {
  const [lang, setLang] = useState('ar');
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const t = dict[lang];
  const navIds = ['home','about','products','fleet','gallery','quote','contact'];
  const galleryItems = useMemo(() => [
    ...productData.map(p => ({ type: 'products', title: lang === 'ar' ? p.ar : p.en, img: p.img })),
    ...fleetData.map(f => ({ type: 'fleet', title: lang === 'ar' ? f.ar : f.en, img: f.img })),
    { type: 'crusher', title: lang === 'ar' ? 'موقع الكسارة' : 'Crusher Site', img: media.crusher },
    { type: 'crusher', title: lang === 'ar' ? 'بيئة تشغيل الكسارة' : 'Crusher Operations', img: media.hero },
    { type: 'fleet', title: lang === 'ar' ? 'موقع عمل' : 'Work Site', img: media.road }
  ], [lang]);
  const filtered = filter === 'all' ? galleryItems : galleryItems.filter(i => i.type === filter);

  return <main dir={t.dir} className={lang === 'ar' ? 'arabic' : 'english'}>
    <header className="siteHeader">
      <div className="topbar"><span><Phone size={14}/>+966 55 123 4567</span><span><Mail size={14}/>info@kheirgroup.com</span><span><MapPin size={14}/>{t.topLocation}</span></div>
      <nav className="navbar">
        <a href="#home" className="brand"><img src={logo} alt="logo"/><span><b>{t.brand}</b><small>{t.sub}</small></span></a>
        <button className="menuBtn" onClick={() => setMenu(!menu)}><Menu size={22}/></button>
        <div className={`navLinks ${menu ? 'open' : ''}`}>{t.nav.map((item, i) => <a key={item} href={`#${navIds[i]}`} onClick={() => setMenu(false)}>{item}</a>)}</div>
        <button className="langBtn" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}><Globe2 size={16}/>{t.switch}</button>
      </nav>
    </header>

    <section id="home" className="hero">
      <div className="heroCopy">
        <span className="kicker">{t.heroKicker}</span>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroText}</p>
        <div className="actions"><a className="btn primary" href="#quote">{t.ctaQuote}</a><a className="btn ghost" href="#gallery">{t.ctaGallery}</a></div>
      </div>
      <div className="heroMedia"><img src={media.hero} alt="heavy machinery"/><div className="heroBadge"><Mountain size={20}/><b>{lang === 'ar' ? 'مواد كسارة معتمدة للمشاريع' : 'Project-ready crusher materials'}</b></div></div>
    </section>

    <section className="featureStrip">{t.features.map((f, i) => <article key={f}>{i === 0 ? <Star/> : i === 1 ? <Truck/> : <CheckCircle2/>}<b>{f}</b></article>)}</section>

    <section id="about" className="section aboutGrid">
      <div className="aboutText"><span className="kicker">{t.aboutKicker}</span><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><div className="checks"><span><CheckCircle2/> {lang === 'ar' ? 'توريد منظم' : 'Organized supply'}</span><span><CheckCircle2/> {lang === 'ar' ? 'متابعة تشغيلية' : 'Operational follow-up'}</span><span><CheckCircle2/> {lang === 'ar' ? 'جودة ثابتة' : 'Consistent quality'}</span></div></div>
      <article className="founderCard"><img src={founder} alt="Founder"/><div><span>{t.founderRole}</span><h3>{t.founderName}</h3><p>{t.founderText}</p></div></article>
    </section>

    <section id="products" className="section"><span className="kicker">{t.productsKicker}</span><h2>{t.productsTitle}</h2><p className="lead">{t.productsNote}</p><div className="cards productsGrid">{productData.map(p => <article className="card" key={p.key}><img src={p.img} alt={p.key}/><div><h3>{lang === 'ar' ? p.ar : p.en}</h3><p>{lang === 'ar' ? p.arDesc : p.enDesc}</p></div></article>)}</div></section>

    <section id="fleet" className="section splitSection"><div><span className="kicker">{t.fleetKicker}</span><h2>{t.fleetTitle}</h2><p>{t.fleetText}</p><a className="btn primary" href="#quote">{t.ctaQuote}</a></div><div className="fleetGrid">{fleetData.map(f => <article key={f.ar}><img src={f.img}/><b>{lang === 'ar' ? f.ar : f.en}</b></article>)}</div></section>

    <section id="gallery" className="section gallerySection"><span className="kicker">{t.galleryKicker}</span><h2>{t.galleryTitle}</h2><div className="filters">{[['all',t.all],['crusher',t.crusher],['fleet',t.fleet],['products',t.products]].map(([k, label]) => <button className={filter === k ? 'active' : ''} onClick={() => setFilter(k)} key={k}>{label}</button>)}</div><div className="galleryGrid">{filtered.map((item, i) => <button className="galleryItem" key={`${item.title}-${i}`} onClick={() => setModal(item)}><img src={item.img}/><span><ImageIcon size={15}/>{item.title}</span></button>)}</div></section>

    <section className="section testimonials"><span className="kicker">{t.testimonialsKicker}</span><h2>{t.testimonialsTitle}</h2><div className="testimonialGrid">{testimonials.map((row, i) => <article key={i}><div>★★★★★</div><p>{lang === 'ar' ? row[0] : row[1]}</p><b>{lang === 'ar' ? 'عميل مشاريع' : 'Project Client'}</b></article>)}</div></section>

    <section id="quote" className="section quoteSection"><div><span className="kicker">{t.quoteKicker}</span><h2>{t.quoteTitle}</h2><p>{t.quoteText}</p></div><form className="quoteForm" onSubmit={(e) => { e.preventDefault(); alert(lang === 'ar' ? 'تم تجهيز الطلب، ويمكن ربط النموذج لاحقاً للإرسال.' : 'Request prepared. The form can be connected later for sending.'); }}><input required placeholder={t.form.name}/><input placeholder={t.form.phone}/><select>{productData.map(p => <option key={p.key}>{lang === 'ar' ? p.ar : p.en}</option>)}</select><input placeholder={t.form.quantity}/><input placeholder={t.form.location}/><textarea placeholder={t.form.message}></textarea><button className="btn primary"><Send size={16}/>{t.form.submit}</button></form></section>

    <footer id="contact"><div className="footerBrand"><img src={logo}/><b>{t.brand}</b><small>{t.sub}</small></div><div className="footerContact"><b>{t.contact}</b><span><Phone size={14}/>+966 55 123 4567</span><span><Mail size={14}/>info@kheirgroup.com</span><span><MapPin size={14}/>{t.topLocation}</span></div><p>{t.footer}</p></footer>

    {modal && <div className="modal" onClick={() => setModal(null)}><button><X/></button><img src={modal.img}/><h3>{modal.title}</h3></div>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
