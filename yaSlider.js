(function($) {
  // значение по умолчанию
var defaults = {
	leftBtn: 'leftBtn',
	rightBtn: 'rightBtn',
	width: '100%',
	height: '100%',
	autoplay: false,
	autoplayDelay: 3,
	startSlide: 1,
	showSlides: 1,
	moveSlides: 1,
	color:'red',
	loop: true,
};


var methods = {
    // инициализация плагина
    init: function(params) {
    // актуальные настройки, будут индивидуальными при каждом запуске
    var options = $.extend({}, defaults, params);

		var buttons = $('.'+options.leftBtn + ', .' + options.rightBtn);

		//отключение кнопок во время анимации
		function disableButtons() {
			buttons.addClass('disable-btn');
		}
		//включение кнопок
		function enableButtons() {
			buttons.removeClass('disable-btn');
		}
		var list = $(this).children('ul');

		var slides = list.children('li');  // slide array

		var slideCount = slides.length; // количество слайдов
		//console.log('slide count: ' + slideCount);

		var activeSlide = options.startSlide; // стартовый слайд
		//console.log('active slide: ' + activeSlide);

		var sliderWidth = parseInt(options.width, 10); // ширина всего слайдера
		var slideWidth = sliderWidth / options.showSlides; // ширина 1 слайда (элемента)
		//console.log('slide width: ' + slideWidth);

		$(this).css({width: (sliderWidth)});
		$(this).parents('.ya-slider-wrap').css({width: sliderWidth});

		if (options.moveSlides > options.showSlides) {
			options.moveSlides = options.showSlides;
		}

		//если слайдов меньше чем должно отображаться
		if (slideCount <= options.showSlides) {
			slides.css({
				left: (options.showSlides - slideCount)*slideWidth/2, // выравниваем по центру
				width: slideWidth
			});
			$('.' + options.leftBtn + ', .' + options.rightBtn).remove(); // убираем кнопки

			return this;
		}

		//если количество слайдов больше, чем отображаемое, копируем слайды в начало и конец списка для бесконечной прокрутки
		if (slideCount > options.showSlides && (options.loop)) {
			var firstClonedSlides = list.find('li:lt(' + options.showSlides + ')');	// выбираем первые showSlides элементов
			var lastClonedSlides = list.find('li:gt('+ (slideCount-1-options.showSlides) +')');	// выбираем последние showSlides элементов
			firstClonedSlides.addClass('ya-clone'); // добавляем классы чтобы отличить клонированные блоки от реальных
			lastClonedSlides.addClass('ya-clone');	// добавляем классы чтобы отличить клонированные блоки от реальных
			firstClonedSlides.clone().appendTo(list);	// вставляем первые слайды в конец
			lastClonedSlides.clone().prependTo(list);	// вставляем последние слайды в начало
			slides = list.children('li');
			slides.css({
				left: '-'+slideWidth*options.showSlides+'px',
				width: slideWidth
			});
			var startOffset = slideWidth*options.showSlides; // начальный отступ, равен ширине скопированный вначало слайдов
		}
		else { // если прокрутка не бесконечная
			slides.css({
				width: slideWidth
			});
			var startOffset = 0; // начальный отступ, если прокрутка не бесконечная, равен нулю
			var endOffset = -(slideCount*slideWidth - options.showSlides*slideWidth); //отступ блока при котором видны все последние слайды
		}

		//если количество сдвигаемых слайдов не задано, оно равно количеству отображаемых слайдов
		if (options.moveSlides == 0) {
			options.moveSlides = options.showSlides;
		}

		// чанки - блоки, по которым происходит перемещение:
		// например, если отображается 2 слайда и перемещаеся по 2 слайда за клик, то
		// весь список слайдов разбиваем на блоки по 2 слайда
		var chunks = new Object;

		chunks.count = Math.ceil(slideCount / options.moveSlides); // количество реальных блоков
		// выбираем стартовый блок
		if (options.startSlide <= chunks.count) {
			chunks.active = options.startSlide;
		}
		else {
			chunks.active = 1;
		}

		//если прокрутка не бесконечная и сдвигаем по 1 слайду, просто уменьшаем количество
		// чтобы не появлялось пустое место в конце
		if (!options.loop && options.moveSlides == 1) {
			chunks.count -= options.showSlides - options.moveSlides;
		}

		//вычисляем сдвиг для каждого блока
		for (i = 0; i < chunks.count; ++i) {
			if (slideCount - options.moveSlides*i > options.moveSlides) { // если блок полный
				// отступ блока = стандартное смещение (из-за дополнительных блоков бесконечной прокрутки) + (ширина слайда * количество сдвигаемых слайдов * номер блока)
				chunks[i+1] =  -(startOffset + slideWidth*options.moveSlides*i);
			}
			else { // если блок заполняется не полностью, отступ будет меньше на ширину недостающих слайдов в блоке
						// отступ неполного блока = отступ предыдущего блока + (слайды неполного блока * ширина слайда)
				chunks[i+1] = parseInt(chunks[i], 10) - (slideCount - options.moveSlides*i)*slideWidth;
			}

			//если прокрутка не бесконечная и отступ блока больше чем тот, при котором видны все последние слайды
			if (!options.loop && chunks[i+1] <= endOffset) {
				chunks[i+1] = endOffset; //устанавливаем сдвиг этого блока на тот, при котором видны последние слайды
				chunks.count = i+1;
				break; // останавливаем цикл
			}
		}

		// флаг - истина если передвигаем меньше слайдов чем отображается
		var flag = false;
		if (options.moveSlides < options.showSlides) {
			flag = true;
		}

		// добавляем дополнительные блоки для бесконечной прокрутки
		// устанавливаем их отступ в соответствии с flag
		if (options.loop) {
			if (flag) {
				chunks[0] = chunks[1] + slideWidth*options.moveSlides;
				chunks[chunks.count+1] = chunks[chunks.count] - slideWidth*options.moveSlides;
			}
			else {
				chunks[0] = 0;
				chunks[chunks.count+1] = chunks[chunks.count] + chunks[1];
			}
		}

		// сдвигаем все слайды на позицию стартового слайда
		slides.css({left: chunks[chunks.active]});

		// переходим на блок вправо
		function moveRight(chunk) {

			disableButtons(); // отключаем кнопки

			// анимация перемещения
			slides.animate({left: chunks[chunk]}, 300,
				function() {
					if (chunk == chunks.count+1) { // если дошли до правого края, сдвигаем список обратно на первый блок
						$(this).css('left', chunks[1]);
					}
					enableButtons(); // включаем кнопки
				}
			);
			chunks.prev = chunks.active; // предыдущий блок, скорее всего не нужен
			if (chunk > chunks.count) {
				chunks.active = 1; // если дошли до правого края, то активый блок - первый
			}
			else { // если нет, то тот, на который сдвинулись
				chunks.active = chunk;
			}
		}

		// переходим на блок влево
		function moveLeft(chunk)  {
			disableButtons(); // отключаем кнопки
			slides.animate({left: chunks[chunk]}, 300,
				function() {
					if (chunk == 0) {	// если дошли до левого края, сдвигаем список на последний блок
						$(this).css('left', chunks[chunks.count]);
					}
					enableButtons(); // включаем кнопки
				}
			);
			chunks.prev = chunks.active; // предыдущий блок, скорее всего не нужен
			if (chunk == 0) { // если дошли до левого края, то активый блок - последний
				chunks.active = chunks.count;
			}
			else { // если нет, то тот, на который сдвинулись
				chunks.active = chunk;
			}
		}


		return this.each(function() {

			if (options.autoplay) {
		    function aPlay() {
		        $('.' + options.rightBtn).click();
		        delId = setTimeout(aPlay, options.autoplayDelay * 1000);
		    }
		    var delId = setTimeout(aPlay, options.autoplayDelay * 1000);
		    slides.hover(
		        function() {
		            clearTimeout(delId);
		        },
		        function() {
		            delId = setTimeout(aPlay, options.autoplayDelay * 1000);
		        }
		    );
			}

			//кнопка "вправо"
			$('.'+options.rightBtn).click(function (event) {
				event.preventDefault;

				if (!$(this).hasClass('disable-btn')) { // если кнопки не отключены
					if (options.loop) {
						moveRight((chunks.active+1)); // перемещаемся вправо на 1 блок
					}
					else {
						if (chunks.active < chunks.count) {
							moveRight((chunks.active+1));
						}
					}
				}
			});


			//кнопка "влево"
			$('.'+options.leftBtn).click(function (event) {
				event.preventDefault;

				if (!$(this).hasClass('disable-btn')) { // если кнопки не отключены
					if (options.loop) {
						moveLeft((chunks.active-1)); // перемещаемся влево на 1 блок
					}
					else {
						if (chunks.active > 1) {
							moveLeft((chunks.active-1));
						}
					}

				}
			});


      });


    },


	foo: function() {
		alert('foo');
	}
};

	$.fn.yaSlider = function(method){

		// немного магии
		if ( methods[method] ) {
			// если запрашиваемый метод существует, мы его вызываем
			// все параметры, кроме имени метода прийдут в метод
			// this так же перекочует в метод
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			// если первым параметром идет объект, либо совсем пусто
			// выполняем метод init
			return methods.init.apply( this, arguments );
		} else {
			// если ничего не получилось
			$.error( 'Метод "' +  method + '" не найден в плагине jQuery.yaSlider' );
		}
	};
})(jQuery);
