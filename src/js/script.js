/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.processOrder();

      console.log('new Product:', thisProduct);
    }

    renderInMenu() {
      const thisProduct = this;

      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      //console.log(generatedHTML);

      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);

    }

    initAccordion() {
      const thisProduct = this;

      /* find the clickable trigger (the element that should react to clicking) */
      //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

      /* START: click event listener to trigger */
      thisProduct.accordionTrigger.addEventListener('click', function () {
        console.log('clicked');

        /* prevent default action for event */
        event.preventDefault();

        /* toggle active class on element of thisProduct */
        thisProduct.element.classList.toggle('active');

        /* find all active products */
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

        /* START LOOP: for each active product */
        for (let activeProduct of activeProducts) {

          /* START: if the active product isn't the element of thisProduct */
          if (activeProduct != thisProduct.element) {

            /* remove class active for the active product */
            activeProduct.classList.remove('active');

            /* END: if the active product isn't the element of thisProduct */
          }

          /* END LOOP: for each active product */
        }

        /* END: click event listener to trigger */
      });
    }

    initOrderForm() {
      const thisProduct = this;
      //console.log(initOrderForm);

      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }
      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    processOrder() {
      const thisProduct = this;
      //console.log(processOrder);

      /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */
      /* przeczytaj wszystkie dane z formularza (using utils.serializeFormToObject) i zapisz to w stałej formData */
      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('formData', formData);

      /* set variable price to equal thisProduct.data.price */
      /* ustaw zmienną cenę na równą thisProduct.data.price */
      let price = thisProduct.data.price;
      console.log(price);

      /* START LOOP: for each paramId in thisProduct.data.params */
      /* START Pętla: dla każdego paramId w thisProduct.data.params */
      for (let paramId in thisProduct.data.params) {

        /* save the element in thisProduct.data.params with key paramId as const param */
        /* zapisz element w thisProduct.data.params z kluczem paramId jako stała param */
        const param = thisProduct.data.params[paramId];

        /* START LOOP: for each optionId in param.options */
        /* START pętla: dla każdej optionId w param.options */
        for (let optionId in param.options) {

          /* save the element in param.options with key optionId as const option */
          /* zapisz element w param.options z kluczem optionId jako stałą option */
          const option = param.options[optionId];
          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;

          /* START IF: if option is selected and option is not default */
          /* START jeśli: jeśli opcja jest wybrana i opcja nie jest domyślna */
          if (optionSelected && !option.default) {

            /* add price of option to variable price */
            /* dodaj cenę opcji do ceny zmiennej */
            price += option.price;

            /* END IF: if option is selected and option is not default */
            /* KONIEC jeśli: jeśli opcja jest wybrana i opcja nie jest domyślna */


            /* START ELSE IF: if option is not selected and option is default */
            /* START jeszcze jeśli: jeśli opcja nie jest wybrana i opcja jest domyślna */
          } else if (!optionSelected && option.default) {

            /* deduct price of option from price */
            /* odejmij cenę opcji od ceny */
            price -= option.price;


            /* END ELSE IF: if option is not selected and option is default */
            /* KONIEC jeszcze jeśli: jeśli opcja nie jest wybrana i opcja jest domyślna */
          }

          /*const selectedImage = thisProduct.imageWrapper.querySelectorAll('');

          if (optionSelected) {

            for (selectedImage of selectedImages) {
              selectedImage.classList.add(classNames.menuProduct.imageVisible);
            }
          } else {

            for (selectedImage of selectedImages) {
              selectedImage.classList.add(classNames.menuProduct.imageVisible);
            }
          } */

          /* END LOOP: for each optionId in param.options */
          /* KONIEC pętli: dla każdej optionId w param.options */
        }

        /* END LOOP: for each paramId in thisProduct.data.params */
        /* KONIEC pętli: dla każdego paramId w thisProduct.data.params */
      }

      /* set the contents of thisProduct.priceElem to be the value of variable price */
      /* ustaw zawartości thisProduct.priceElem jako wartość ceny zmiennej */
      thisProduct.priceElem = thisProduct.price;

    }

  }




  const app = {
    initMenu: function () {
      const thisApp = this;
      console.log('thisApp.data:', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function () {
      const thisApp = this;

      thisApp.data = dataSource;
    },

    init: function () {
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
    },
  };

  app.init();
}
