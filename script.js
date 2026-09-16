document.addEventListener("DOMContentLoaded", () => {
    // Add hero-loaded class for hero entrance animations
    setTimeout(() => {
        document.body.classList.add('hero-loaded');
    }, 100);

    const heroBg = document.getElementById("hero-bg");
    const rotatingLeaves = document.getElementById("rotating-leaves");
    const navbar = document.querySelector(".navbar");
    const mobileToggle = document.querySelector(".mobile-toggle");
    
    if (mobileToggle) {
        mobileToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            navbar.classList.toggle("mobile-menu-open");
            // Change SVG icon to X when open
            if (navbar.classList.contains("mobile-menu-open")) {
                mobileToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            } else {
                mobileToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
            }
        });

        // Close mobile menu when clicking any link inside the menu
        const menuLinks = document.querySelectorAll(".nav-menu a");
        menuLinks.forEach(link => {
            link.addEventListener("click", () => {
                if (navbar.classList.contains("mobile-menu-open")) {
                    navbar.classList.remove("mobile-menu-open");
                    mobileToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener("click", (e) => {
            if (navbar.classList.contains("mobile-menu-open") && !navbar.contains(e.target)) {
                navbar.classList.remove("mobile-menu-open");
                mobileToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
            }
        });
    }

    window.addEventListener("scroll", () => {
        // Get the current scroll position
        const scrollPosition = window.pageYOffset;
        
        // Navbar sticky styling on scroll
        if (navbar) {
            if (scrollPosition > 50) {
                navbar.classList.add('is-scrolled');
            } else {
                navbar.classList.remove('is-scrolled');
            }
        }
        
        // Calculate the translation amount for hero background.
        const yPos = scrollPosition * 0.4;
        
        // Calculate the zoom (scale) amount
        const scale = 1 + scrollPosition * 0.0005;
        
        // Apply the transformation to hero background
        // Legacy hero background translation replaced by scroll-scrubbed frame sequence hero
        if (heroBg) {
            heroBg.style.transform = `translateY(${yPos}px) scale(${scale})`;
        }

        // Apply rotation to the leaves in the Why Choose Us section
        if (rotatingLeaves) {
            // Rotating slightly based on scroll position
            rotatingLeaves.style.transform = `rotate(${scrollPosition * 0.1}deg)`;
        }
    });

    // Intersection Observer for scroll reveal animations
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-scale');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // =========================================================================
    // GSAP + SCROLLTRIGGER SCROLL-SCRUBBED FRAME ANIMATION HERO
    // =========================================================================
    const heroSection = document.getElementById("hero-scroll-section");
    const heroCanvas = document.getElementById("hero-canvas");

    if (heroSection && heroCanvas) {
        if (window.gsap && window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
        }

        const ctx = heroCanvas.getContext("2d", { alpha: false });
        const loader = document.getElementById("hero-loader");
        const loaderPct = document.getElementById("hero-loader-pct");
        const contentStart = document.getElementById("hero-content-start");
        const contentEnd = document.getElementById("hero-content-end");
        const scrollHint = document.getElementById("hero-scroll-hint");

        const BASE_DIR = "assets/hero-section-frames/hero_section_frames/";
        let totalFrames = 141;
        let getFramePath = (i) => `${BASE_DIR}ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
        const frames = [];
        let activeFrameIndex = 0;
        let lastDrawnIndex = -1;
        let rafPending = false;

        let drawX = 0, drawY = 0, drawW = 0, drawH = 0;

        // Precalculate canvas dimensions and cover coordinates on resize
        function updateCanvasSize() {
            const w = heroCanvas.clientWidth;
            const h = heroCanvas.clientHeight;
            if (!w || !h) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const targetW = Math.round(w * dpr);
            const targetH = Math.round(h * dpr);

            if (heroCanvas.width !== targetW || heroCanvas.height !== targetH) {
                heroCanvas.width = targetW;
                heroCanvas.height = targetH;
            }

            const imgAspect = 1280 / 720;
            const canvasAspect = targetW / targetH;

            if (canvasAspect > imgAspect) {
                drawW = targetW;
                drawH = Math.round(targetW / imgAspect);
                drawX = 0;
                drawY = Math.round((targetH - drawH) / 2);
            } else {
                drawH = targetH;
                drawW = Math.round(targetH * imgAspect);
                drawX = Math.round((targetW - drawW) / 2);
                drawY = 0;
            }

            lastDrawnIndex = -1;
            renderFrame(activeFrameIndex);
        }

        // Blit frame to canvas only when the frame index changes
        function renderFrame(index) {
            if (index === lastDrawnIndex) return;

            let img = frames[index];
            if (!img || !img.complete || !img.naturalWidth) {
                // Nearest-available frame fallback during initial preload
                for (let offset = 1; offset < totalFrames; offset++) {
                    if (index - offset >= 0 && frames[index - offset] && frames[index - offset].complete) {
                        img = frames[index - offset];
                        break;
                    }
                    if (index + offset < totalFrames && frames[index + offset] && frames[index + offset].complete) {
                        img = frames[index + offset];
                        break;
                    }
                }
            }

            if (!img || !img.complete || !img.naturalWidth) return;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            lastDrawnIndex = index;
        }

        function updateOverlayText(progress) {
            // 0 -> 0.18: Start content fades out
            if (contentStart) {
                const startOpacity = Math.max(0, 1 - (progress / 0.18));
                contentStart.style.opacity = startOpacity;
                contentStart.style.transform = `translateY(calc(-50% - ${progress * 40}px))`;
                contentStart.style.pointerEvents = startOpacity < 0.1 ? "none" : "auto";
            }

            // Scroll hint fades out early (by 0.06)
            if (scrollHint) {
                const hintOpacity = Math.max(0, 1 - (progress / 0.06));
                scrollHint.style.opacity = hintOpacity;
                scrollHint.style.pointerEvents = hintOpacity < 0.1 ? "none" : "auto";
            }

            // 0.82 -> 1.0: Transformed completion content fades in
            if (contentEnd) {
                const endOpacity = Math.min(1, Math.max(0, (progress - 0.82) / 0.16));
                contentEnd.style.opacity = endOpacity;
                contentEnd.style.transform = `translateY(calc(-50% + ${(1 - endOpacity) * 20}px))`;
                contentEnd.style.pointerEvents = endOpacity < 0.1 ? "none" : "auto";
            }
        }

        let heroScrollTrigger = null;

        // Initialize ScrollTrigger with pinSpacing: false and smooth scrub: 1.2
        function initScrollTrigger() {
            if (!window.ScrollTrigger) return;
            if (heroScrollTrigger) {
                heroScrollTrigger.kill();
            }

            heroScrollTrigger = ScrollTrigger.create({
                trigger: "#hero-scroll-section",
                start: "top top",
                end: "bottom bottom",
                pin: "#hero-pin-wrapper",
                pinSpacing: false,
                scrub: 1.2,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const progress = Math.min(Math.max(self.progress, 0), 1);
                    const targetIndex = Math.min(Math.floor(progress * totalFrames), totalFrames - 1);

                    if (targetIndex !== activeFrameIndex) {
                        activeFrameIndex = targetIndex;
                        if (!rafPending) {
                            rafPending = true;
                            requestAnimationFrame(() => {
                                renderFrame(activeFrameIndex);
                                rafPending = false;
                            });
                        }
                    }

                    updateOverlayText(progress);
                }
            });
        }

        // Full preloading of all frames before enabling interaction
        function startPreloading() {
            let loadedCount = 1; // frame 0 is already loaded

            function onPreloadDone() {
                if (loader) {
                    loader.classList.add("is-hidden");
                    setTimeout(() => {
                        loader.style.display = "none";
                    }, 400);
                }
                initScrollTrigger();
                if (window.ScrollTrigger) {
                    ScrollTrigger.refresh();
                }
            }

            const BATCH_SIZE = 12;
            let nextIndex = 1;

            function loadNextBatch() {
                while (nextIndex < totalFrames && (nextIndex - loadedCount) < BATCH_SIZE) {
                    const idx = nextIndex++;
                    const img = new Image();

                    const handleLoaded = () => {
                        frames[idx] = img;
                        loadedCount++;
                        if (loaderPct) {
                            loaderPct.textContent = `${Math.round((loadedCount / totalFrames) * 100)}%`;
                        }
                        if (loadedCount >= totalFrames) {
                            onPreloadDone();
                        } else {
                            loadNextBatch();
                        }
                    };

                    img.onload = () => {
                        if (typeof img.decode === "function") {
                            img.decode().then(handleLoaded).catch(handleLoaded);
                        } else {
                            handleLoaded();
                        }
                    };

                    img.onerror = () => {
                        loadedCount++;
                        if (loadedCount >= totalFrames) {
                            onPreloadDone();
                        } else {
                            loadNextBatch();
                        }
                    };

                    img.src = getFramePath(idx);
                }
            }

            loadNextBatch();
        }

        // Probe for ezgif-frame-001.jpg vs egzif-frame-0.jpg
        const probe1 = new Image();
        probe1.src = `${BASE_DIR}ezgif-frame-001.jpg`;
        probe1.onload = () => {
            totalFrames = 141;
            getFramePath = (i) => `${BASE_DIR}ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
            frames[0] = probe1;
            updateCanvasSize();
            renderFrame(0);
            startPreloading();
        };
        probe1.onerror = () => {
            const probe2 = new Image();
            probe2.src = `${BASE_DIR}egzif-frame-0.jpg`;
            probe2.onload = () => {
                totalFrames = 142;
                getFramePath = (i) => `${BASE_DIR}egzif-frame-${i}.jpg`;
                frames[0] = probe2;
                updateCanvasSize();
                renderFrame(0);
                startPreloading();
            };
            probe2.onerror = () => {
                totalFrames = 141;
                getFramePath = (i) => `${BASE_DIR}ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
                updateCanvasSize();
                startPreloading();
            };
        };

        window.addEventListener("resize", () => {
            updateCanvasSize();
            if (window.ScrollTrigger) {
                ScrollTrigger.refresh();
            }
        }, { passive: true });
    }

    // Carousel logic
    const track = document.getElementById("carousel-track");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (track && prevBtn && nextBtn) {
        const getScrollAmount = () => {
            const firstCard = track.querySelector(".project-card");
            if (firstCard) {
                const style = window.getComputedStyle(track);
                const gap = parseInt(style.gap) || 20;
                return firstCard.offsetWidth + gap;
            }
            return 320;
        };

        prevBtn.addEventListener("click", () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
        });

        nextBtn.addEventListener("click", () => {
            track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
        });
    }

    // Tab switching logic for Gardering page
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    if (tabBtns.length > 0 && tabPanels.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-tab");

                tabBtns.forEach(b => b.classList.remove("active"));
                tabPanels.forEach(p => p.classList.remove("active"));

                btn.classList.add("active");
                const targetPanel = document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add("active");
                }
            });
        });
    }

    // FAQ Accordion logic
    const faqItems = document.querySelectorAll(".faq-item");
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const questionBtn = item.querySelector(".faq-question");
            if (questionBtn) {
                questionBtn.addEventListener("click", () => {
                    const isOpen = item.classList.contains("active");
                    // Close others for clean accordion feel
                    faqItems.forEach(i => i.classList.remove("active"));
                    if (!isOpen) {
                        item.classList.add("active");
                    }
                });
            }
        });
    }

});


