ko.virtualElements.allowedBindings = true;

var numericObservable = function (initialValue) {
    var _actual = ko.observable(initialValue);
    var result = ko.computed({
        read: function () {
            return _actual();
        },
        write: function (newValue) {
            var parsedValue = parseFloat(newValue);
            _actual(isNaN(parsedValue) ? newValue : parsedValue);
        }
    });
    return result;
};

var dataItems = [{
        id: 1,
        name: "one",
        active: true
    }, {
        id: 2,
        name: "two",
        active: false
    }, {
        id: 3,
        name: "three",
        active: false
    }, {
        id: 4,
        name: "four",
        active: true
    }, {
        id: 5,
        name: "five",
        active: true
    }, {
        id: 6,
        name: "six",
        active: false
}];

var ListView = function (title, template, viewOptions, app) {
    var self = this;

    // Basic view properties
    this.title     = title;
    this.template  = template;
    this.options = viewOptions;
    this.data = ko.observable(app.data);

    var getData = function() {
        return self.data()() || [];
    }
    this.filtered = ko.computed(function() {
        var items = getData();
        if (self.options.filter)
            items = _.filter(items, function(item) {
                var props = _.keys(self.options.filter);
                return _.every(props, function(prop) {
                    //console.log(self.options.filter[prop], item[prop];
                    return self.options.filter[prop] === ko.utils.unwrapObservable(item[prop]);
                });
            });
        return items;
    }, this);

    // Total length of underlying dataset
    this.dataLength = ko.computed(function() {
        return self.filtered().length;
    }, this);

    // Pagination
    this.currentPage    = numericObservable(1);
    this.pageSize       = 5;
    this.pageSlide      = numericObservable(2);
    this.lastPage = ko.computed(function () {
        return Math.floor((self.dataLength() - 1) / self.pageSize) + 1;
    });
    this.hasNextPage = ko.computed(function () {
        return self.currentPage() < self.lastPage();
    });
    this.hasPrevPage = ko.computed(function () {
        return self.currentPage() > 1;
    });
    this.pageStart = ko.computed(function () {
        return self.pageSize * (self.currentPage() - 1);
    });
    this.pageEnd = ko.computed(function () {
        return Math.min(self.pageStart() + self.pageSize, self.dataLength());
    });
    this.pageNumbers = ko.computed(function () {
        var pageCount = self.lastPage();
        var pageFrom  = Math.max(1, self.currentPage() - self.pageSlide());
        var pageTo    = Math.min(pageCount, self.currentPage() + self.pageSlide());
        pageFrom      = Math.max(1, Math.min(pageTo - 2 * self.pageSlide(), pageFrom));
        pageTo        = Math.min(pageCount, Math.max(pageFrom + 2 * self.pageSlide(), pageTo));

        var result = [];
        for (var i = pageFrom; i <= pageTo; i++) {
            result.push(i);
        }
        return result;
    });
    this.paged = ko.computed(function() {
        return { items: self.filtered().slice(self.pageStart(), self.pageEnd()) };
    }, this);

    // Searching
    this.searched = ko.computed(function() {
        var search = self.options.query().toLowerCase();
        if (search) {
            return {
                items: ko.utils.arrayFilter(self.filtered(), function(x) { 
                    return x.name().toLowerCase().indexOf(search) >= 0; 
                })
            };
        }
        return self.paged();
    }, this);
};

var ViewOptions = function (filter) {
    return {
        query:  ko.observable(''),
        filter: filter
    };
};

var App = (function(listItems) {

    var model = {};

    // Data
    var mapping = {
        'data': {
            key: function(item) {
                return ko.utils.unwrapObservable(item.id);
            }
        }
    };
    ko.mapping.fromJS({ data: listItems }, mapping, model);
    // Views
    var all      = new ViewOptions(null);
    var active   = new ViewOptions({ active: true });
    var inactive = new ViewOptions({ active: false });

    model.selectedView = ko.observable();
    model.views = ko.observableArray([
        new ListView("All", "listTmpl", all, model),
        new ListView("Active", "listTmpl", active, model),
        new ListView("Inactive", "listTmpl", inactive, model),
    ]);

    model.update = function(data) {
        ko.mapping.fromJS({ data: data }, mapping, model);
    };

    return model;

})(dataItems);

var timeout = setTimeout(function() {
    dataItems.push({ active: true, name: 'Stuff', id: 11 });
    dataItems[0].active = false;
    App.update(dataItems);
}, 3000);

ko.applyBindings(App);