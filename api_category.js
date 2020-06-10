// Get categories for anyl articles in transaction.model 
// that doesn't have categories defined yet.

class ApiCall_Categories extends ApiCallBase
{
    constructor(transaction, model) {
        super(transaction, model);
    }

    run() {
        // max 50 per query
        let counter = 0;
        let titles="";
        for (let title of Object.keys(this.model.articles)) {
            titles += (counter ? "|" : "") + title;
            counter++;
            if(counter==50) {
                this.query(titles);
                titles = "";
                counter = 0;
            }
        }
        this.query(titles);
    }

    query(titles) {
        // console.log(titles);
        super.run({
            data: {
                action: 'query',
                titles: titles,
                prop: 'categories',
                clshow: '!hidden',
                cllimit: 'max'
            }
        });
    }

    onDone(data) {
        console.log(data);
    }
}