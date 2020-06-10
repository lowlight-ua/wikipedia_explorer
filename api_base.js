// An API transaction represents a set of `ApiCallBase`s that run asynchronously in parallel.
// The only point of a transaction is the ability to notify `onComplete` when the last call finishes.

class ApiTransaction {
    steps = 0;
    onComplete;

    constructor(onComplete) {
        this.onComplete = onComplete;
    }

    onStepBegin() {
        this.steps++;
    }

    onStepComplete() {
        this.steps--;
        if (this.steps == 0) { this.onComplete(); }
    }
}

// ----------------------------------------------------------------------------

// Any jquery-based Wikimedia API call, based on raw query configuration.

class ApiCallBase
{
    transaction;
    model;

    constructor(transaction, model) {
        if(!transaction) { throw new Error("transaction empty"); }
        if(!model) { throw new Error("model empty"); }
        this.transaction = transaction;
        this.model = model;
    }

    run(ajaxConfig) {
        if(!ajaxConfig) { throw new Error("ajaxConfig empty"); }

        const cfg = ajaxConfig;    
        cfg.url = 'https://en.wikipedia.org/w/api.php',    
        cfg.data.format = 'json';
        cfg.data.origin = '*';
        cfg.data.redirects = 1;
        cfg.xhrFields = {};
        cfg.xhrFields.withCredentials = false;
        cfg.dataType = 'json';

        this.transaction.onStepBegin();
        const thisObj = this;
        $.ajax(ajaxConfig).done(function(data, status) {
            console.debug("________________________________________________");
            console.debug(cfg);
            console.debug(status);
            console.debug(data);
            thisObj.onDone(data, status);
            thisObj.transaction.onStepComplete();
        });
    }
}

// ----------------------------------------------------------------------------

// API call, configured by an article title. Abstract, unusable directly.

class ApiCallByTitle extends ApiCallBase
{
    title;

    constructor(transaction, model, title) {
        super(transaction, model);
        if(!title) { throw new Error("Empty title"); }
        this.title = title;
    }
}

// ----------------------------------------------------------------------------

function titlefy(titles, limit, callback) {
    let titleString = "";
    let counter = 0;
    for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        titleString += (counter ? "|" : "") + title;
        counter++;
        if(counter == limit) {
            callback(titleString);
            titleString = "";
            counter = 0;
        }
    }
    if (titleString.length > 0) {
        callback(titleString);
    }
}