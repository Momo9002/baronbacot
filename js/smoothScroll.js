/**
 * Baron Bacot — Seamless Scroll Experience
 * ─────────────────────────────────────────
 * Uses native momentum scrolling + GSAP ScrollTrigger for:
 *  - Parallax fade on section transitions (stagger opacity + translateY)
 *  - Header transparency shift
 *  - Fade-in observer (already handled by script.js but enhanced here)
 *
 * ScrollSmoother is a GSAP Club plugin; we gracefully degrade if unavailable.
 */

(function () {
    /* ── Guard: wait for GSAP ── */
    if (typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    /* ── Seamless section reveal: each section fades and lifts in ── */
    const sections = document.querySelectorAll('.home-section');

    sections.forEach((section, i) => {
        /* Skip the hero (already handled by cinFade animations) */
        if (i === 0) return;

        /* Any direct children that aren't already .fade-in */
        const contentBoxes = section.querySelectorAll(
            '.section-text, .gallery-header, .gallery-work, .gallery-objects, .gallery-footer, ' +
            '.offer-text, .offer-card, .practice-grid, .method-text, .lead-text, .lead-form, ' +
            '.access-inner, .access-stats, .btn-group-access'
        );

        contentBoxes.forEach((box, boxIdx) => {
            /* Skip if already a .fade-in (managed by the IntersectionObserver) */
            if (box.classList.contains('fade-in')) return;

            gsap.from(box, {
                opacity: 0,
                y: 32,
                duration: 1.1,
                ease: 'power3.out',
                delay: boxIdx * 0.08,
                scrollTrigger: {
                    trigger: box,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                    once: true
                }
            });
        });
    });

    /* ── Parallax depth on the statement background image ── */
    const statBg = document.querySelector('.statement-bg-image');
    if (statBg) {
        gsap.to(statBg, {
            yPercent: 20,
            ease: 'none',
            scrollTrigger: {
                trigger: statBg.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    }


    /* ── Gallery work images: subtle parallax on each ── */
    const galleryImgs = document.querySelectorAll('.gallery-work-img img');
    galleryImgs.forEach(img => {
        gsap.to(img, {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
                trigger: img.closest('.gallery-work'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });


    /* ── Header opacity: becomes slightly more opaque mid-scroll ── */
    /* (already handled by script.js but this adds a tween for smoother feel) */

    /* ── Access section: count-up on stat numbers ── */
    const statNums = document.querySelectorAll('.stat-num, .cin-metric-num');
    statNums.forEach(el => {
        const raw = el.textContent.trim();
        /* Only animate numeric values */
        const num = parseFloat(raw.replace(/[^\d.]/g, ''));
        if (!isNaN(num) && num > 0 && num < 10000) {
            const prefix = raw.match(/^\D*/)?.[0] || '';
            const suffix = raw.match(/\D+$/)?.[0] || '';
            const obj = { val: 0 };

            ScrollTrigger.create({
                trigger: el,
                start: 'top 88%',
                once: true,
                onEnter() {
                    gsap.to(obj, {
                        val: num,
                        duration: 1.6,
                        ease: 'power2.out',
                        onUpdate() {
                            el.textContent = prefix + Math.round(obj.val) + suffix;
                        },
                        onComplete() {
                            el.textContent = raw; // restore original (handles $1,500 etc.)
                        }
                    });
                }
            });
        }
    });

})();
