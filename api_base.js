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

class ApiCall
{
    transaction;
    explorer;

    constructor(transaction, explorer) {
        if(!transaction) { throw new Error("transaction empty"); }
        if(!explorer) { throw new Error("explorer empty"); }
        this.transaction = transaction;
        this.explorer = explorer;
    }

    run(ajaxConfig) {
        if(!ajaxConfig) { throw new Error("ajaxConfig empty"); }

        const cfg = ajaxConfig;    
        cfg.url = 'https://en.wikipedia.org/w/api.php',    
        cfg.data.format = 'json';
        cfg.data.origin = '*';
        cfg.xhrFields = {};
        cfg.xhrFields.withCredentials = false;
        cfg.dataType = 'json';

        this.transaction.onStepBegin();
        const thisOp = this;
        $.ajax(ajaxConfig).done(function(data, status) {
            thisOp.onDone(data, status)
            thisOp.transaction.onStepComplete();
        });
    }
}

// ----------------------------------------------------------------------------

// API call, configured by an article title. Abstract, unusable directly.

class ApiCallByTitle extends ApiCall
{
    title;

    constructor(transaction, explorer, title) {
        super(transaction, explorer);
        if(!title) { throw new Error("Empty title"); }
        this.title = title;
    }
}
