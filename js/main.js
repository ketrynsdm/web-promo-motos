document.addEventListener('DOMContentLoaded', () => {
  // Initialize all interactive modules
  initCountdownTimer();
  initSpotsCounter();
  initCouponModal();
  initDealsSearchAndFilter();
  initFAQAccordion();
  initLiveToastNotifications();
  initBackToTopButton();
  initExitIntentPopup();
  initMobileMenu();
});

/* ==========================================================================
   1. COUNTDOWN TIMER (Urgency Header)
   ========================================================================== */
function initCountdownTimer() {
  const timerElement = document.getElementById('ticker-timer');
  if (!timerElement) return;

  // Set initial countdown duration: 15 minutes and 42 seconds
  let duration = 15 * 60 + 42; 

  function updateTimer() {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');

    timerElement.textContent = `${minutesStr}:${secondsStr}`;

    if (duration > 60) {
      duration--;
    } else if (duration > 0) {
      // Flash red on last minute
      timerElement.classList.add('text-brand-crimson', 'animate-pulse');
      duration--;
    } else {
      // Reset timer to 12 minutes to keep urgency realistic
      duration = 12 * 60 + 15;
      timerElement.classList.remove('text-brand-crimson', 'animate-pulse');
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================================
   2. SPOTS REMAINING COUNTER (Social Urgency)
   ========================================================================== */
function initSpotsCounter() {
  const spotElements = document.querySelectorAll('.live-spots');
  if (spotElements.length === 0) return;

  // Retrieve existing spot count or set a starting point
  let spots = parseInt(localStorage.getItem('promo_spots_left')) || 34;

  function updateSpotsDisplay() {
    spotElements.forEach(elem => {
      elem.textContent = spots;
      if (spots <= 5) {
        elem.classList.add('text-brand-crimson', 'font-black');
        elem.parentElement.classList.add('animate-pulse');
      }
    });
  }

  function decreaseSpots() {
    if (spots > 3) {
      // High chance of dropping when spots are many, slowing down as we reach limit
      const chance = Math.random();
      if (chance > 0.6) {
        spots -= Math.floor(Math.random() * 2) + 1; // Decrease by 1 or 2
        localStorage.setItem('promo_spots_left', spots);
        updateSpotsDisplay();
        
        // Show a custom live notification when a spot is taken
        showLiveNotificationOfJoin();
      }
    } else {
      // Loop back to 14 spots if we hit bottom, simulating a group refresh or slot release
      setTimeout(() => {
        spots = Math.floor(Math.random() * 10) + 12;
        localStorage.setItem('promo_spots_left', spots);
        updateSpotsDisplay();
      }, 30000);
    }
  }

  updateSpotsDisplay();
  
  // Set random interval to decrease spots (every 12 to 25 seconds)
  const intervalTime = () => Math.floor(Math.random() * 13000) + 12000;
  
  function triggerNextDecrease() {
    setTimeout(() => {
      decreaseSpots();
      triggerNextDecrease();
    }, intervalTime());
  }
  
  triggerNextDecrease();
}

/* ==========================================================================
   3. DEALS SEARCH AND FILTER
   ========================================================================== */
// Expanded mockup database of deals to allow robust filtering and searching
const DEALS_DATA = [
  {
    id: 1,
    title: 'Capacete Asx Draken Vector',
    category: 'capacetes',
    brands: 'AGV, Shark, Shoei, LS2',
    image: './imagens/Capacete-AGV.jpg',
    originalPrice: 'R$ 629,00',
    discountPrice: 'R$ 462,94',
    discountPercent: '-26% OFF',
    badge: 'Cupom',
    source: 'Mercado Livre • Loja Oficial',
    verified: true,
  },
  {
    id: 2,
    title: 'Jaqueta Alpinestars T-Sps V2 Impermeável',
    category: 'vestuario',
    brands: 'Alpinestars, Dainese, ASW',
    image: './imagens/Jaqueta-Alpinestars.jpg',
    originalPrice: 'R$ 2.390,00',
    discountPrice: 'R$ 1.679,46',
    discountPercent: '-32% OFF',
    badge: 'Cupom',
    source: 'Amazon Brasil • Vendido por Alpinestars',
    verified: true,
  },
  {
    id: 3,
    title: 'Intercomunicador Cardo Freecom 4x ',
    category: 'acessorios',
    brands: 'Cardo, Sena, Interphone',
    image: './imagens/Intercomunicador-Cardo.jpg',
    originalPrice: 'R$ 4.249,95',
    discountPrice: 'R$ 2.764,40',
    discountPercent: '-58% OFF',
    badge: 'Cupom',
    source: 'Giga Moto Store',
    verified: true,
  },
  {
    id: 4,
    title: 'Luva Moto Alpinestars Urbano Gp Pro R4 Preto',
    category: 'vestuario',
    brands: 'Alpinestars, Dainese, ASW',
    image: './imagens/Luvas-de-Couro.jpg',
    originalPrice: 'R$ 2.250,00',
    discountPrice: 'R$ 1.994,90',
    discountPercent: '-12% OFF',
    badge: 'Cupom',
    source: 'Motocard Brasil',
    verified: true,
  },
  {
    id: 5,
    title: 'Kit Relação Completo DID/Riffel Honda CB 300R',
    category: 'pecas',
    brands: 'DID, Riffel, Brembo, NGK',
    image: './imagens/Kit-Relação.jpg',
    originalPrice: 'R$ 560,00',
    discountPrice: 'R$ 439,01',
    discountPercent: '-22% OFF',
    badge: 'Cupom',
    source: 'Mercado Livre • Loja Oficial Honda',
    verified: true,
  },
  {
    id: 6,
    title: 'Capacete Nzi Combi 3 Duo ',
    category: 'capacetes',
    brands: 'AGV, Shark, Shoei, LS2',
    image: './imagens/Capacete-Nzi.jpg',
    originalPrice: 'R$ 1.249,00',
    discountPrice: 'R$ 799,90',
    discountPercent: '-45% OFF',
    badge: 'Cupom',
    source: 'NRS Motos',
    verified: true,
  }
];

function initDealsSearchAndFilter() {
  const searchInput = document.getElementById('deal-search');
  const filterButtons = document.querySelectorAll('.deal-filter-btn');
  const dealsContainer = document.getElementById('deals-grid');

  if (!dealsContainer) return;

  let activeCategory = 'all';
  let searchQuery = '';

  function renderDeals() {
    // Clear container
    dealsContainer.innerHTML = '';

    // Filter deals
    const filteredDeals = DEALS_DATA.filter(deal => {
      const matchesCategory = activeCategory === 'all' || deal.category === activeCategory;
      const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            deal.brands.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            deal.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (filteredDeals.length === 0) {
      dealsContainer.innerHTML = `
        <div class="col-span-full py-12 text-center text-gray-500">
          <i class="fas fa-magnifying-glass text-4xl mb-4 text-zinc-700"></i>
          <p class="text-lg font-tech uppercase tracking-wider text-gray-400">Nenhuma oferta encontrada</p>
          <p class="text-sm mt-1 text-gray-500">Tente buscar por termos diferentes ou selecione outra categoria.</p>
        </div>
      `;
      return;
    }

    // Render cards
    filteredDeals.forEach(deal => {
      const card = document.createElement('div');
      card.className = `bg-brand-card rounded-2xl border border-zinc-800/80 overflow-hidden group hover:border-brand-red/60 transition-all duration-300 flex flex-col justify-between opacity-0 translate-y-4 animate-fade-in`;
      card.style.animation = 'fadeInUp 0.4s ease forwards';
      
      // Determine icon based on category
      let categoryIcon = '<i class="fas fa-wrench text-xl"></i>';
      if (deal.category === 'capacetes') {
        categoryIcon = `<svg class="w-7 h-7 text-brand-crimson transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.2 5.42 3.12 7.24.47.45 1.11.66 1.76.59l4.82-.54c.73-.08 1.41-.44 1.88-1.01l1.72-2.07c.36-.43.9-.68 1.47-.68h2.38c.95 0 1.83-.54 2.25-1.39.87-1.74.87-3.76.12-5.59C20.61 5.4 16.64 2 12 2zm1.2 9.5H6.8c-.44 0-.8-.36-.8-.8v-.4c0-2.32 1.88-4.2 4.2-4.2h3.6c.44 0 .8.36.8.8v2.4c0 1.22-.98 2.2-2.2 2.2z"></path>
        </svg>`;
      } else if (deal.category === 'vestuario') {
        categoryIcon = '<i class="fas fa-vest text-xl"></i>';
      } else if (deal.category === 'pecas') {
        categoryIcon = '<i class="fas fa-gear text-xl"></i>';
      }

      card.innerHTML = `
        <div class="relative h-48 overflow-hidden bg-zinc-900 flex items-center justify-center">
          <div class="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent z-10"></div>
          <!-- Real mockup image with elegant fallback -->
          <img src="${deal.image}" alt="${deal.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-80">
          <div class="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider z-20 shadow-lg">
            ${deal.discountPercent}
          </div>
          <div class="absolute top-3 left-3 bg-zinc-950/80 border border-white/10 backdrop-blur-md text-gray-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider z-20">
            ${deal.source}
          </div>
        </div>
        
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 text-brand-crimson mb-3">
              ${categoryIcon}
              <span class="text-xs font-bold uppercase tracking-wider text-gray-400">${deal.category}</span>
            </div>
            <h4 class="font-tech text-xl font-bold text-white mb-2 group-hover:text-brand-crimson transition-colors leading-snug">
              ${deal.title}
            </h4>
            <div class="my-4">
              <span class="text-xs text-gray-500 line-through">De: ${deal.originalPrice}</span>
              <div class="text-2xl font-racing text-white flex items-baseline gap-1 mt-0.5">
                <span class="text-emerald-400 text-sm font-sans font-bold">Por:</span>
                <span class="text-emerald-400 font-extrabold">${deal.discountPrice}</span>
              </div>
            </div>
          </div>
          
          <div class="border-t border-zinc-800/80 pt-4 mt-2">
            <div class="flex items-center justify-between text-xs text-gray-400 mb-4">
              <span class="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded font-semibold text-zinc-300">${deal.badge}</span>
              <span class="text-emerald-400 font-semibold flex items-center gap-1">
                <i class="fas fa-circle-check"></i> Oferta Verificada
              </span>
            </div>
            
            
          </div>
        </div>
      `;

      dealsContainer.appendChild(card);
    });

    // Re-attach event listeners to new buttons
    if (typeof attachDealsButtonEvents === 'function') {
      attachDealsButtonEvents();
    }
  }

  // Handle category filtering
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      filterButtons.forEach(b => b.classList.remove('bg-brand-red', 'text-white', 'border-brand-crimson'));
      filterButtons.forEach(b => b.classList.add('bg-zinc-900', 'text-gray-400', 'border-transparent'));
      
      // Add active to clicked
      btn.classList.add('bg-brand-red', 'text-white', 'border-brand-crimson');
      btn.classList.remove('bg-zinc-900', 'text-gray-400', 'border-transparent');

      activeCategory = btn.getAttribute('data-category');
      renderDeals();
    });
  });

  // Handle search typing
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderDeals();
    });
  }

  // Initial Render
  renderDeals();
}

/* ==========================================================================
   4. INTERACTIVE COUPON MODAL
   ========================================================================== */
let selectedDeal = null;

function initCouponModal() {
  const modal = document.getElementById('coupon-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCopyZone = document.getElementById('modal-copy-zone');
  const couponText = document.getElementById('modal-coupon-code');
  const copyBtnText = document.getElementById('modal-copy-btn-text');
  const copyIcon = document.getElementById('modal-copy-icon');
  const modalDealTitle = document.getElementById('modal-deal-title');
  const modalDealImg = document.getElementById('modal-deal-img');
  const modalGoBtn = document.getElementById('modal-go-btn');

  if (!modal) return;

  // Global callback to attach click listeners to dynamically generated deal buttons
  window.attachDealsButtonEvents = function() {
    const dealButtons = document.querySelectorAll('.btn-pegar-oferta');
    dealButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const dealId = parseInt(button.getAttribute('data-id'));
        const deal = DEALS_DATA.find(d => d.id === dealId);
        if (deal) {
          openCouponModal(deal);
        }
      });
    });
  };

  function openCouponModal(deal) {
    selectedDeal = deal;
    modalDealTitle.textContent = deal.title;
    modalDealImg.src = deal.image;
    couponText.value = deal.couponCode;
    
    // Reset copy button state
    copyBtnText.textContent = 'ENTRE';
    copyIcon.className = 'fas fa-copy text-lg text-brand-crimson';
    modalCopyZone.classList.remove('border-emerald-500/60', 'bg-emerald-950/20');
    modalCopyZone.classList.add('border-brand-red/30', 'bg-zinc-950');

    // Make modal visible
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // Stop scrolling behind modal
  }

  function closeCouponModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = ''; // Restore scroll
    selectedDeal = null;
  }

  // Close triggers
  if (modalClose) {
    modalClose.addEventListener('click', closeCouponModal);
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCouponModal();
    }
  });

  // Copy trigger
  if (modalCopyZone) {
    modalCopyZone.addEventListener('click', () => {
      navigator.clipboard.writeText(couponText.value).then(() => {
        // Change UI state to copied
        copyBtnText.textContent = 'COPIADO!';
        copyIcon.className = 'fas fa-check text-lg text-emerald-400';
        modalCopyZone.classList.remove('border-brand-red/30', 'bg-zinc-950');
        modalCopyZone.classList.add('border-emerald-500/60', 'bg-emerald-950/20');

        // Trigger native-like feedback toast
        showToastNotification(`Cupom "${couponText.value}" copiado! Cole no carrinho de compras.`);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  }

  // Go to deal trigger
  if (modalGoBtn) {
    modalGoBtn.addEventListener('click', () => {
      // Track lead button click event using Meta Pixel if available
      if (typeof fbq === 'function') {
        fbq('track', 'LeadButtonClick', {value: 0.50, currency: 'BRL'});
      }
      // Simulate going to group/link
      showToastNotification('Redirecionando para a loja parceira com segurança...');
      setTimeout(() => {
        window.open('https://chat.whatsapp.com/L5gA8Sx8s0v3xDWmjG59bD', '_blank');
      }, 1000);
    });
  }
}

/* ==========================================================================
   5. INTERACTIVE FAQ ACCORDION
   ========================================================================== */
function initFAQAccordion() {
  const accordionItems = document.querySelectorAll('.faq-accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other items
      accordionItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const content = otherItem.querySelector('.faq-content');
          content.style.maxHeight = null;
          content.style.opacity = '0';
        }
      });

      // Toggle current
      if (isActive) {
        item.classList.remove('active');
        const content = item.querySelector('.faq-content');
        content.style.maxHeight = null;
        content.style.opacity = '0';
      } else {
        item.classList.add('active');
        const content = item.querySelector('.faq-content');
        content.style.maxHeight = content.scrollHeight + "px";
        content.style.opacity = '1';
      }
    });
  });
}

/* ==========================================================================
   6. LIVE TOAST NOTIFICATIONS (Social Proof & Urgency)
   ========================================================================== */
const NOUNS = ['Carlos', 'Rodrigo', 'Felipe', 'Matheus', 'Lucas', 'Thiago', 'Gustavo', 'Gabriel', 'Marcelo', 'Juliano', 'Bruno', 'Andre', 'Fabio', 'Alexandre', 'Daniel'];
const SURNAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pinto', 'Ribeiro', 'Costa', 'Carvalho', 'Almeida', 'Nascimento', 'Teixeira', 'Martins', 'Araujo', 'Mendes'];
const CITIES = ['São Paulo/SP', 'Rio de Janeiro/RJ', 'Belo Horizonte/MG', 'Curitiba/PR', 'Porto Alegre/RS', 'Campinas/SP', 'Goiânia/GO', 'Salvador/BA', 'Recife/PE', 'Florianópolis/SC', 'Joinville/SC', 'Londrina/PR', 'Santos/SP', 'Sorocaba/SP'];
const SAVINGS_TEMPLATES = [
  { item: 'Capacete AGV K3', amount: 'R$ 1.305' },
  { item: 'Jaqueta Alpinestars', amount: 'R$ 1.096' },
  { item: 'Intercomunicador Cardo', amount: 'R$ 1.280' },
  { item: 'Pneu Pirelli Diablo', amount: 'R$ 380' },
  { item: 'Kit Relação DID', amount: 'R$ 171' },
  { item: 'Luvas Alpinestars GP Pro', amount: 'R$ 562' },
  { item: 'Par de Velas Iridium NGK', amount: 'R$ 140' }
];

let toastTimeout = null;

function showToastNotification(text, duration = 4000) {
  let toast = document.getElementById('notification-toast');
  
  if (!toast) {
    // Create Toast dynamic element if it doesn't exist
    toast = document.createElement('div');
    toast.id = 'notification-toast';
    toast.className = 'fixed bottom-5 left-5 right-5 md:right-auto md:max-w-md bg-zinc-900 border border-zinc-800 text-gray-200 px-5 py-4 rounded-2xl shadow-glow-red flex items-center gap-4 z-50 glass-panel transition-all duration-500';
    document.body.appendChild(toast);
  }

  // Clear pending timeouts
  if (toastTimeout) clearTimeout(toastTimeout);

  toast.innerHTML = `
    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-brand-red/20 text-brand-crimson shrink-0">
      <i class="fas fa-circle-check text-xl"></i>
    </div>
    <div class="flex-1">
      <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider">Descontou Alerta</p>
      <p class="text-sm font-medium mt-0.5">${text}</p>
    </div>
    <button class="text-gray-500 hover:text-white" onclick="document.getElementById('notification-toast').classList.remove('show')">
      <i class="fas fa-xmark"></i>
    </button>
  `;

  // Animate Entrance
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  // Automatically hide after duration
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Emits a specific join notification based on dynamic spots change
function showLiveNotificationOfJoin() {
  const name = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const initial = SURNAMES[Math.floor(Math.random() * SURNAMES.length)].charAt(0);
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  
  const toast = document.getElementById('notification-toast');
  
  const isJoin = Math.random() > 0.4; // 60% chance to be a group join, 40% to be an offer saving
  let title = '';
  let msg = '';
  let icon = '';

  if (isJoin) {
    title = 'Entrou no Grupo VIP';
    msg = `<span class="text-white font-bold">${name} ${initial}.</span> de ${city} acabou de preencher uma vaga!`;
    icon = '<i class="fab fa-whatsapp text-xl text-[#25D366]"></i>';
  } else {
    const save = SAVINGS_TEMPLATES[Math.floor(Math.random() * SAVINGS_TEMPLATES.length)];
    title = 'Economia Realizada!';
    msg = `<span class="text-white font-bold">${name} ${initial}.</span> economizou <span class="text-emerald-400 font-bold">${save.amount}</span> na compra do <span class="text-white italic font-medium">${save.item}</span>!`;
    icon = '<i class="fas fa-piggy-bank text-xl text-brand-crimson"></i>';
  }

  if (!toast) return;

  if (toastTimeout) clearTimeout(toastTimeout);

  toast.innerHTML = `
    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 shrink-0">
      ${icon}
    </div>
    <div class="flex-1">
      <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider">${title}</p>
      <p class="text-xs sm:text-sm mt-0.5 leading-relaxed text-zinc-300">${msg}</p>
    </div>
    <button class="text-gray-500 hover:text-white" onclick="document.getElementById('notification-toast').classList.remove('show')">
      <i class="fas fa-xmark text-sm"></i>
    </button>
  `;

  toast.classList.add('show');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}

function initLiveToastNotifications() {
  // Wait initially for 6 seconds before running the loop
  setTimeout(() => {
    showLiveNotificationOfJoin();
    
    // Periodically show every 14 to 22 seconds
    const interval = () => Math.floor(Math.random() * 8000) + 14000;
    
    function triggerNextToast() {
      setTimeout(() => {
        showLiveNotificationOfJoin();
        triggerNextToast();
      }, interval());
    }
    
    triggerNextToast();
  }, 6000);
}

/* ==========================================================================
   7. BACK TO TOP BUTTON
   ========================================================================== */
function initBackToTopButton() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.add('opacity-100', 'translate-y-0');
    } else {
      btn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.remove('opacity-100', 'translate-y-0');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==========================================================================
   8. EXIT-INTENT POPUP MODAL (Retention Booster)
   ========================================================================== */
function initExitIntentPopup() {
  const popup = document.getElementById('exit-intent-popup');
  const closeBtn = document.getElementById('exit-popup-close');
  const delayTime = 30000; // Backup timer: Show popup anyway after 30s of inactivity

  if (!popup) return;

  let hasShown = sessionStorage.getItem('exit_popup_shown') === 'true';

  function showExitPopup() {
    if (hasShown) return;
    popup.classList.remove('hidden');
    popup.classList.add('flex');
    document.body.style.overflow = 'hidden';
    hasShown = true;
    sessionStorage.setItem('exit_popup_shown', 'true');
  }

  function closeExitPopup() {
    popup.classList.add('hidden');
    popup.classList.remove('flex');
    document.body.style.overflow = '';
  }

  // Detect mouse leaving viewport to top
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 20) {
      showExitPopup();
    }
  });

  // Backup Timer
  setTimeout(() => {
    showExitPopup();
  }, delayTime);

  if (closeBtn) {
    closeBtn.addEventListener('click', closeExitPopup);
  }

  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      closeExitPopup();
    }
  });
}

/* ==========================================================================
   9. MOBILE HAMBURGER MENU
   ========================================================================== */
function initMobileMenu() {
  const burgerBtn = document.getElementById('burger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu-link');

  if (!burgerBtn || !mobileMenu) return;

  function toggleMenu() {
    const isExpanded = burgerBtn.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      // Close
      burgerBtn.setAttribute('aria-expanded', 'false');
      burgerBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
      mobileMenu.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
      mobileMenu.classList.remove('translate-y-0', 'opacity-100');
    } else {
      // Open
      burgerBtn.setAttribute('aria-expanded', 'true');
      burgerBtn.innerHTML = '<i class="fas fa-xmark text-xl"></i>';
      mobileMenu.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
      mobileMenu.classList.add('translate-y-0', 'opacity-100');
    }
  }

  burgerBtn.addEventListener('click', toggleMenu);

  // Close menu when clicking on nav link
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      burgerBtn.setAttribute('aria-expanded', 'false');
      burgerBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
      mobileMenu.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
      mobileMenu.classList.remove('translate-y-0', 'opacity-100');
    });
  });
}
