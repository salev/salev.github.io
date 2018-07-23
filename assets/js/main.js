(function ($) {
    "use strict"; // this function is executed in strict mode
    
    $(function () {
        /* ------------------------------------------------------------------------- *
         * SCOPE VARIABLES
         * ------------------------------------------------------------------------- */
        var wn = $(window);
        
        /* ------------------------------------------------------------------------- *
         * SCROLL TO
         * ------------------------------------------------------------------------- */
        var $scrollToEl = $('.ScrollTo');
        
        $scrollToEl.on('click', function () {
            var attr = $(this).attr('href');
            
            $('html,body').animate({
                scrollTop: $(attr).offset().top
            }, 700);

            return false;
        });
    });
    
    $(window).on('load', function () {
        /* ------------------------------------------------------------------------- *
         * PRELOADER
         * ------------------------------------------------------------------------- */
        var $preloader = $('#preloader');
        
        if ( $preloader.length ) {
            $preloader.fadeOut();
        }
    });
})(jQuery);
