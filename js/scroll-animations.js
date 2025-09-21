// Scroll Animation Controller
class ScrollAnimations {
    constructor() {
        this.animatedElements = [];
        this.observer = null;
        this.isInitialized = false;
        this.lastScrollY = 0;
        this.scrollDirection = 'down';
        this.init();
    }

    init() {
        // Wait for DOM to be loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('🎭 Setting up scroll animations...');
        
        // Track scroll direction
        this.setupScrollTracking();
        
        // Create intersection observer first
        this.createObserver();
        
        // Add animation classes to static elements immediately
        this.addStaticAnimationClasses();
        
        // Set up listeners for dynamic content
        this.setupDynamicContentListeners();
        
        // Start observing static elements
        this.observeStaticElements();
        
        this.isInitialized = true;
        console.log('✅ Scroll animations setup complete!');
    }

    setupScrollTracking() {
        console.log('🎯 Setting up scroll tracking...');
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const previousDirection = this.scrollDirection;
            // For inverse/natural scrolling: when user scrolls "up" (towards hero), 
            // scrollY decreases, so we reverse the logic
            this.scrollDirection = currentScrollY < this.lastScrollY ? 'up' : 'down';
            
            if (previousDirection !== this.scrollDirection) {
                console.log(`📍 Scroll direction changed to: ${this.scrollDirection}, scrollY: ${currentScrollY}`);
            }
            
            // Check for fly-away effects on scroll
            this.checkFlyAwayEffects();
            
            this.lastScrollY = currentScrollY;
        }, { passive: true });
    }

    checkFlyAwayEffects() {
        if (this.scrollDirection === 'up') {
            // When scrolling up, check all visible elements to see if they should fly away
            const visibleElements = this.animatedElements.filter(el => el.classList.contains('visible'));
            console.log(`🔍 Checking ${visibleElements.length} visible elements for fly-away...`);
            
            visibleElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                // If element is approaching the bottom of viewport while scrolling up, make it fly away
                // Trigger when element is 200px from bottom edge (earlier trigger)
                if (rect.top > window.innerHeight - 200) { 
                    console.log(`🚀 Making element fly away during scroll! ${element.className}, top: ${rect.top}, windowHeight: ${window.innerHeight}`);
                    this.applyFlyAwayEffect(element);
                }
            });
        }
    }

    addStaticAnimationClasses() {
        console.log('🎨 Adding static animation classes...');
        
        // Add animations to static elements that exist on page load
        const heroContent = document.querySelector('.hero-content');
        const heroVisual = document.querySelector('.hero-visual');
        // Don't add scroll animation classes to hero elements (they use CSS animations)

        const seeMoreContainer = document.querySelector('.see-more-container');
        if (seeMoreContainer) {
            seeMoreContainer.classList.add('fade-in');
            console.log('➕ Added fade-in to see-more-container');
        }

        const footer = document.querySelector('.footer');
        if (footer) {
            footer.classList.add('fade-in-up');
            console.log('➕ Added fade-in-up to footer');
        }

        // Add animations to nav bar after page load
        setTimeout(() => {
            const navBar = document.querySelector('.nav-bar');
            if (navBar) {
                navBar.style.transform = 'translateY(-100%)';
                navBar.style.transition = 'transform 0.8s ease-out';
                requestAnimationFrame(() => {
                    navBar.style.transform = 'translateY(0)';
                });
                console.log('➕ Added nav-bar animation');
            }
        }, 100);
        
        console.log('✅ Static animation classes added');
    }

    setupDynamicContentListeners() {
        // Listen for custom events when dynamic content is loaded
        document.addEventListener('dynamicContentLoaded', (event) => {
            console.log('🎭 Applying animations to dynamically loaded content');
            this.addAnimationsToDynamicContent();
        });

        // Also set up a MutationObserver to catch any DOM changes
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any added nodes are our target elements
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.processNewElement(node);
                        }
                    });
                }
            });
        });

        // Start observing the document body for changes
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    processNewElement(element) {
        // Check if this element or its children are items we want to animate
        if (element.classList.contains('grid-item') || 
            element.classList.contains('resource-item') || 
            element.classList.contains('calendar-item') ||
            element.classList.contains('section')) {
            this.addAnimationToElement(element);
        }

        // Also check children
        const childElements = element.querySelectorAll('.grid-item, .resource-item, .calendar-item, .section');
        childElements.forEach(child => {
            this.addAnimationToElement(child);
        });
    }

    addAnimationToElement(element) {
        let animationClass = '';
        
        if (element.classList.contains('grid-item')) {
            // Alternate left/right animations for grid items
            const gridItems = document.querySelectorAll('.grid-item');
            const index = Array.from(gridItems).indexOf(element);
            animationClass = index % 2 === 0 ? 'fade-in-left' : 'fade-in-right';
        } else if (element.classList.contains('resource-item')) {
            // Alternate left/right animations for resource items
            const resourceItems = document.querySelectorAll('.resource-item');
            const index = Array.from(resourceItems).indexOf(element);
            animationClass = index % 2 === 0 ? 'fade-in-left' : 'fade-in-right';
        } else if (element.classList.contains('calendar-item')) {
            animationClass = 'fade-in';
        } else if (element.classList.contains('section')) {
            animationClass = 'fade-in-up';
        }

        if (animationClass && !element.classList.contains(animationClass)) {
            element.classList.add(animationClass);
            // Start observing this new element
            if (this.observer) {
                this.observer.observe(element);
                this.animatedElements.push(element);
            }
        }
    }

    addAnimationsToDynamicContent() {
        console.log('🔄 Re-scanning for dynamic content...');
        
        // Re-scan and add animations to all dynamic elements
        const sections = document.querySelectorAll('.section');
        console.log(`Found ${sections.length} sections`);
        sections.forEach(section => {
            if (!section.classList.contains('fade-in-up')) {
                section.classList.add('fade-in-up');
                console.log('➕ Added fade-in-up to section');
            }
        });

        const gridItems = document.querySelectorAll('.grid-item');
        console.log(`Found ${gridItems.length} grid items`);
        gridItems.forEach((item, index) => {
            const animationClass = index % 2 === 0 ? 'fade-in-left' : 'fade-in-right';
            if (!item.classList.contains('fade-in-left') && !item.classList.contains('fade-in-right')) {
                item.classList.add(animationClass);
                console.log(`➕ Added ${animationClass} to grid item ${index}`);
            }
        });

        const resourceItems = document.querySelectorAll('.resource-item');
        console.log(`Found ${resourceItems.length} resource items`);
        resourceItems.forEach((item, index) => {
            const animationClass = index % 2 === 0 ? 'fade-in-left' : 'fade-in-right';
            if (!item.classList.contains('fade-in-left') && !item.classList.contains('fade-in-right')) {
                item.classList.add(animationClass);
                console.log(`➕ Added ${animationClass} to resource item ${index}`);
            }
        });

        const calendarItems = document.querySelectorAll('.calendar-item');
        console.log(`Found ${calendarItems.length} calendar items`);
        calendarItems.forEach(item => {
            if (!item.classList.contains('fade-in')) {
                item.classList.add('fade-in');
                console.log('➕ Added fade-in to calendar item');
            }
        });

        // Start observing all new elements
        this.observeAllElements();
    }

    createObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const rect = entry.boundingClientRect;
                console.log(`👁️ Element ${entry.target.className} - isIntersecting: ${entry.isIntersecting}, top: ${rect.top}, bottom: ${rect.bottom}`);
                
                if (entry.isIntersecting) {
                    // Element is entering viewport - show it
                    console.log('✅ Element entering viewport, making visible');
                    entry.target.classList.remove('fly-away');
                    entry.target.classList.remove('fly-away-dramatic');
                    entry.target.classList.add('visible');
                } else {
                    // Element is leaving viewport
                    console.log(`❌ Element leaving viewport, direction: ${this.scrollDirection}, top: ${rect.top}`);
                    
                    // Only remove visible class if we're not scrolling up, or if element is going above viewport
                    if (this.scrollDirection !== 'up' || rect.bottom < 0) {
                        console.log('🔄 Removing visible class');
                        entry.target.classList.remove('visible');
                    } else {
                        console.log('⏸️ Keeping visible class for potential fly-away');
                    }
                }
            });
        }, options);
    }

    applyFlyAwayEffect(element) {
        console.log('🚀 Applying fly-away effect to:', element.classList.toString());
        element.classList.remove('visible');
        element.classList.add('fly-away');
        
        // Add dramatic fly-away animation with randomization
        const randomDirection = Math.random() > 0.5 ? 1 : -1;
        const randomDistance = 80 + Math.random() * 60;
        const randomRotation = (Math.random() * 30 - 15) * randomDirection;
        
        // Set CSS custom properties for the animation
        element.style.setProperty('--fly-x', `${randomDistance * randomDirection}px`);
        element.style.setProperty('--fly-rotation', `${randomRotation}deg`);
        
        // Add a small random delay for staggered effect
        const delay = Math.random() * 150;
        setTimeout(() => {
            element.classList.add('fly-away-dramatic');
            
            // Remove the dramatic class after animation completes
            setTimeout(() => {
                element.classList.remove('fly-away-dramatic');
            }, 800);
        }, delay);
    }

    resetElementState(element) {
        element.classList.remove('visible');
        element.classList.remove('fly-away');
        element.style.transform = ''; // Reset any custom transforms
    }

    observeStaticElements() {
        // Observe only static elements initially
        const staticAnimatedElements = document.querySelectorAll(
            '.fade-in, .fade-in-left, .fade-in-right, .fade-in-up'
        );

        console.log(`👀 Found ${staticAnimatedElements.length} static elements to observe`);
        staticAnimatedElements.forEach((element, index) => {
            console.log(`   ${index + 1}. ${element.tagName}.${element.className}`);
            this.observer.observe(element);
            this.animatedElements.push(element);
        });
    }

    observeAllElements() {
        // Get all elements with animation classes (including newly added ones)
        const allAnimatedElements = document.querySelectorAll(
            '.fade-in, .fade-in-left, .fade-in-right, .fade-in-up'
        );

        allAnimatedElements.forEach(element => {
            // Check if we're not already observing this element
            if (!this.animatedElements.includes(element)) {
                this.observer.observe(element);
                this.animatedElements.push(element);
            }
        });
    }

    // Method to manually trigger animations (useful for dynamically added content)
    triggerAnimation(element) {
        if (element) {
            element.classList.add('visible');
        }
    }

    // Method to reset animations
    resetAnimations() {
        this.animatedElements.forEach(element => {
            element.classList.remove('visible');
        });
    }

    // Destroy observer (cleanup)
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Initialize scroll animations when script loads
const scrollAnimations = new ScrollAnimations();

// Export for use in other scripts if needed
window.ScrollAnimations = scrollAnimations;

// Add a test function to manually trigger animations
window.testAnimations = function() {
    console.log('🧪 Testing animations manually...');
    const testElements = document.querySelectorAll('.grid-item, .resource-item, .section');
    console.log(`Found ${testElements.length} elements to test`);
    
    testElements.forEach((element, index) => {
        if (index < 3) { // Test first 3 elements
            console.log(`Testing element ${index + 1}:`, element);
            element.classList.add('fade-in-left');
            
            setTimeout(() => {
                element.classList.add('visible');
                console.log('Added visible class to element', index + 1);
            }, 100 * index);
            
            setTimeout(() => {
                console.log('Applying fly-away to element', index + 1);
                scrollAnimations.applyFlyAwayEffect(element);
            }, 2000 + (500 * index));
        }
    });
};

// Add test for all visible elements
window.testFlyAwayAll = function() {
    console.log('🚀 Testing fly-away on all visible elements...');
    const visibleElements = document.querySelectorAll('.visible');
    console.log(`Found ${visibleElements.length} visible elements`);
    
    visibleElements.forEach((element, index) => {
        setTimeout(() => {
            console.log(`Flying away element ${index + 1}:`, element.className);
            scrollAnimations.applyFlyAwayEffect(element);
        }, index * 200);
    });
};

console.log('🎭 Scroll animations script loaded. Test with: testAnimations() or testFlyAwayAll()');
