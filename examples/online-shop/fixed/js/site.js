/* Lindenmoor Tea Company: example site of the eu-web-compliance project (fixed version).
   Basket kept in localStorage under the key "basket" (declared exempt: shopping basket).
   Nothing is written before the visitor uses "Add to basket". */
(function () {
  'use strict';

  var KEY = 'basket';

  function readBasket() {
    try {
      var items = JSON.parse(window.localStorage.getItem(KEY) || '[]');
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  function saveBasket(items) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
      return true;
    } catch (error) {
      return false;
    }
  }

  function initAddToBasket() {
    var button = document.getElementById('add-to-basket');
    var status = document.getElementById('basket-status');
    if (!button || !status) {
      return;
    }
    button.addEventListener('click', function () {
      var id = button.getAttribute('data-product-id');
      var items = readBasket();
      var found = items.filter(function (item) { return item.id === id; })[0];
      var next = found
        ? items.map(function (item) { return item.id === id ? { id: item.id, name: item.name, price: item.price, qty: item.qty + 1 } : item; })
        : items.concat([{ id: id, name: button.getAttribute('data-product-name'), price: button.getAttribute('data-product-price'), qty: 1 }]);
      status.textContent = saveBasket(next)
        ? button.getAttribute('data-product-name') + ' added to your basket.'
        : 'Your browser does not let us keep a basket. Please try again with storage enabled.';
    });
  }

  function cell(text) {
    var td = document.createElement('td');
    td.textContent = text;
    return td;
  }

  function initBasketPage() {
    var rows = document.getElementById('basket-rows');
    var empty = document.getElementById('basket-empty');
    var filled = document.getElementById('basket-filled');
    if (!rows || !empty || !filled) {
      return;
    }
    var items = readBasket();
    if (!items.length) {
      return;
    }
    items.forEach(function (item) {
      var tr = document.createElement('tr');
      tr.appendChild(cell(item.name + ', 100 g'));
      tr.appendChild(cell(String(item.qty)));
      tr.appendChild(cell('€' + (Number(item.price) * item.qty).toFixed(2)));
      rows.appendChild(tr);
    });
    empty.setAttribute('hidden', '');
    filled.removeAttribute('hidden');
  }

  function init() {
    initAddToBasket();
    initBasketPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
