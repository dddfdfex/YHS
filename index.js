// انتظار تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إنشاء جسيمات متحركة
    createParticles();
    
    // الثيم والتغييرات الديناميكية
    const themeSwitch = document.getElementById('themeSwitch');
    const body = document.body;
    
    // التحقق من الثيم المحفوظ
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // تبديل الثيم
    themeSwitch.addEventListener('click', function() {
        body.classList.toggle('dark-theme');
        body.classList.toggle('light-theme');
        
        if (body.classList.contains('light-theme')) {
            themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('portfolio-theme', 'light');
        } else {
            themeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('portfolio-theme', 'dark');
        }
        
        // تأثير عند التبديل
        createThemeTransition();
    });
    
    // تأثير انتقال الثيم
    function createThemeTransition() {
        const transition = document.createElement('div');
        transition.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--gradient-primary);
            z-index: 9999;
            opacity: 0;
            animation: themeTransition 0.8s ease-out;
            pointer-events: none;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes themeTransition {
                0% {
                    opacity: 0;
                    transform: scale(0);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(1.5);
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(transition);
        
        setTimeout(() => {
            transition.remove();
            style.remove();
        }, 1000);
    }
    
    // تبديل اللغة
    const langSwitch = document.getElementById('langSwitch');
    let isEnglish = false;
    
    langSwitch.addEventListener('click', function() {
        isEnglish = !isEnglish;
        
        // تأثير التبديل
        this.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 300);
        
        if (isEnglish) {
            langSwitch.textContent = 'AR';
            showAlert('Language switched to English', 'info');
            // هنا يمكن إضافة وظيفة الترجمة الكاملة
        } else {
            langSwitch.textContent = 'EN';
            showAlert('تم تبديل اللغة إلى العربية', 'info');
        }
    });
    
    // قائمة الهاتف المحمول
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
        
        if (this.classList.contains('active')) {
            this.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            this.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            
            // تحديد الرابط النشط
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            // تحديث مؤشر التنقل
            updateNavIndicator(this);
        });
    });
    
    // مؤشر التنقل المتحرك
    function updateNavIndicator(activeLink) {
        const indicator = document.querySelector('.nav-indicator');
        const linkRect = activeLink.getBoundingClientRect();
        const navRect = document.querySelector('.navbar').getBoundingClientRect();
        
        indicator.style.width = `${linkRect.width}px`;
        indicator.style.left = `${linkRect.left - navRect.left}px`;
    }
    
    // تحديث مؤشر التنقل أول مرة
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
        updateNavIndicator(activeLink);
    }
    
    // إنشاء جسيمات متحركة
    function createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // حجم عشوائي
            const size = Math.random() * 5 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // موضع عشوائي
            particle.style.left = `${Math.random() * 100}%`;
            
            // لون عشوائي
            const colors = ['var(--neon-blue)', 'var(--neon-pink)', 'var(--neon-green)', 'var(--neon-purple)'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            
            // تأخير عشوائي
            const delay = Math.random() * 15;
            particle.style.animationDelay = `${delay}s`;
            
            // مدة عشوائية
            const duration = Math.random() * 10 + 10;
            particle.style.animationDuration = `${duration}s`;
            
            container.appendChild(particle);
        }
    }
    
    // أنيميشن التمرير
    function animateOnScroll() {
        const sections = document.querySelectorAll('.section');
        const backToTop = document.getElementById('backToTop');
        const windowHeight = window.innerHeight;
        const revealPoint = 150;
        
        // زر العودة للأعلى
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            
            if (sectionTop < windowHeight - revealPoint) {
                section.classList.add('visible');
                
                // تحريك أشرطة التقدم
                if (section.id === 'skills') {
                    animateSkillBars();
                }
                
                // تحريك أشرطة البرامج
                if (section.id === 'software') {
                    animateSoftwareLevels();
                }
                
                // تحريك الباقات
                if (section.id === 'pricing') {
                    animatePricingCards();
                }
            }
        });
        
        // تحديث مؤشر التنقل
        updateActiveLinkOnScroll();
    }
    
    // تحديث الرابط النشط أثناء التمرير
    function updateActiveLinkOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const correspondingLink = document.querySelector(`a[href="#${sectionId}"]`);
            
            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                    updateNavIndicator(correspondingLink);
                }
            }
        });
    }
    
    // تشغيل أنيميشن التمرير
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
    
    // أنيميشن أشرطة المهارات
    function animateSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        
        skillBars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            if (!bar.classList.contains('animated')) {
                bar.style.width = width + '%';
                bar.classList.add('animated');
            }
        });
    }
    
    // أنيميشن أشرطة البرامج
    function animateSoftwareLevels() {
        const levelBars = document.querySelectorAll('.level-progress');
        
        levelBars.forEach(bar => {
            const level = bar.getAttribute('data-level');
            if (!bar.classList.contains('animated')) {
                bar.style.width = level + '%';
                bar.classList.add('animated');
            }
        });
    }
    
    // أنيميشن كروت الباقات
    function animatePricingCards() {
        const cards = document.querySelectorAll('.pricing-card');
        
        cards.forEach((card, index) => {
            if (!card.classList.contains('animated')) {
                card.style.animationDelay = `${index * 0.2}s`;
                card.classList.add('animated');
            }
        });
    }
    
    // التمرير السلس للروابط الداخلية
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // زر العودة للأعلى
    const backToTop = document.getElementById('backToTop');
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // تحكم شريط البرامج
    let currentSlide = 0;
    const sliderTrack = document.querySelector('.slider-track');
    const sliderItems = document.querySelectorAll('.software-card');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (sliderTrack && sliderItems.length > 0) {
        const itemWidth = sliderItems[0].offsetWidth + 32; // width + gap
        
        function updateSlider() {
            sliderTrack.style.transform = `translateX(-${currentSlide * itemWidth}px)`;
            
            // تحديد المؤشرات
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentSlide);
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                currentSlide = currentSlide > 0 ? currentSlide - 1 : sliderItems.length - 3;
                updateSlider();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                currentSlide = currentSlide < sliderItems.length - 3 ? currentSlide + 1 : 0;
                updateSlider();
            });
        }
        
        // مؤشرات النقر
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', function() {
                currentSlide = index;
                updateSlider();
            });
        });
        
        // التمرير التلقائي
        setInterval(() => {
            currentSlide = currentSlide < sliderItems.length - 3 ? currentSlide + 1 : 0;
            updateSlider();
        }, 5000);
    }
    
    // نموذج الاتصال
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // الحصول على القيم
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // التحقق من البيانات
            if (!name || !email || !subject || !message) {
                showAlert('الرجاء ملء جميع الحقول', 'error');
                return;
            }
            
            // محاكاة إرسال النموذج
            const submitButton = this.querySelector('.submit-button');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                // نجاح الإرسال
                submitButton.innerHTML = '<i class="fas fa-check"></i> تم الإرسال بنجاح!';
                submitButton.style.background = 'linear-gradient(135deg, var(--neon-green), #27ae60)';
                
                // إظهار رسالة النجاح
                showAlert('تم إرسال رسالتك بنجاح! سأتواصل معك قريبًا.', 'success');
                
                // إعادة تعيين النموذج
                contactForm.reset();
                
                // العودة إلى الحالة الأصلية بعد 3 ثوانٍ
                setTimeout(() => {
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                    submitButton.style.background = '';
                }, 3000);
            }, 2000);
        });
    }
    
    // تفاعل كروت الباقات
    const planButtons = document.querySelectorAll('.plan-button');
    
    planButtons.forEach(button => {
        button.addEventListener('click', function() {
            const planCard = this.closest('.pricing-card');
            const planName = planCard.querySelector('.plan-name').textContent;
            const planPrice = planCard.querySelector('.price').textContent;
            
            // تأثير النقر
            this.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                this.style.transform = '';
                showAlert(`تم اختيار ${planName} بسعر ${planPrice} جنيه مصري. سيتم التواصل معك قريبًا!`, 'success');
            }, 300);
        });
    });
    
    // زر الطلب المخصص
    const customButton = document.querySelector('.custom-button');
    
    if (customButton) {
        customButton.addEventListener('click', function() {
            // تمرير إلى قسم الاتصال
            document.querySelector('#contact').scrollIntoView({
                behavior: 'smooth'
            });
            
            // إظهار رسالة
            setTimeout(() => {
                showAlert('أهلاً! سأكون سعيداً بالعمل على مشروعك المخصص. أخبرني بالتفاصيل في النموذج أدناه.', 'info');
                document.getElementById('subject').value = 'طلب مشروع مخصص';
                document.getElementById('message').focus();
            }, 800);
        });
    }
    
    // وظيفة عرض التنبيهات
    function showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        
        // أيقونة حسب النوع
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        alert.innerHTML = `
            <i class="fas ${icon}"></i>
            <span class="naskh-font">${message}</span>
        `;
        
        alertContainer.appendChild(alert);
        
        // إزالة التنبيه بعد 3 ثوانٍ
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
    
    // تأثيرات hover متقدمة للكروت
    const cards = document.querySelectorAll('.pricing-card, .software-card, .contact-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateY = (x - centerX) / 25;
            const rotateX = (centerY - y) / 25;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
    
    // تحميل عشوائي للصورة الشخصية
    const profileImg = document.getElementById('profileImg');
    
    if (profileImg) {
        // إضافة تأثير تحميل للصورة
        profileImg.style.opacity = '0';
        profileImg.style.transform = 'scale(0.8)';
        profileImg.style.transition = 'opacity 1s ease, transform 1s ease';
        
        setTimeout(() => {
            profileImg.style.opacity = '1';
            profileImg.style.transform = 'scale(1)';
        }, 500);
    }
    
    // تأثيرات النقر على الأزرار
    document.querySelectorAll('button, .contact-btn, .footer-link').forEach(button => {
        button.addEventListener('click', function(e) {
            // تأثير النقر
            const x = e.clientX - this.getBoundingClientRect().left;
            const y = e.clientY - this.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            const size = Math.max(this.offsetWidth, this.offsetHeight);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x - size / 2}px`;
            ripple.style.top = `${y - size / 2}px`;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            // إضافة animation للripple
            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            
            document.head.appendChild(style);
            
            setTimeout(() => {
                ripple.remove();
                style.remove();
            }, 600);
        });
    });
    
    // تأثيرات الكتابة الديناميكية
    const typingText = document.querySelector('.typing');
    if (typingText) {
        const text = typingText.textContent;
        typingText.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                typingText.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        }
        
        // بدء الكتابة بعد تأخير
        setTimeout(typeWriter, 1000);
    }
    
    // تهيئة الرسم البياني للرادار
    const radarCanvas = document.getElementById('radarChart');
    if (radarCanvas) {
        const ctx = radarCanvas.getContext('2d');
        
        // بيانات المهارات
        const skillsData = {
            labels: ['المونتاج', 'الموشن جرافيك', 'التصميم', 'التلوين', 'الصوت', 'الإخراج'],
            datasets: [{
                label: 'مستوى المهارات',
                data: [95, 90, 85, 75, 80, 88],
                backgroundColor: 'rgba(108, 142, 255, 0.2)',
                borderColor: 'rgba(108, 142, 255, 1)',
                pointBackgroundColor: 'rgba(108, 142, 255, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(108, 142, 255, 1)',
                borderWidth: 2
            }]
        };
        
        // رسم الرادار
        new Chart(ctx, {
            type: 'radar',
            data: skillsData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: 'var(--dark-text)',
                            font: {
                                family: 'Reem Kufi',
                                size: 14
                            }
                        },
                        ticks: {
                            display: false,
                            maxTicksLimit: 5
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // تأثيرات الوضع الليلي النهاري الديناميكية
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;
    
    if (isNight && !savedTheme) {
        // إذا كان ليلاً ولم يكن هناك ثيم محفوظ، استخدم الثيم الداكن
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
        themeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
    }
});