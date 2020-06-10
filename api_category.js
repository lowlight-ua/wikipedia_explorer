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
        
        for (let [title, article] of Object.entries(this.model.articles)) {
            if(article.categories.length == 0) {
                titles += (counter ? "|" : "") + title;
                counter++;
                if(counter==50) {
                    this.query(titles);
                    titles = "";
                    counter = 0;
                }
            }
        }
        this.query(titles);
    }

    query(titles) {
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
        const qp = data.query.pages;
        const model = this.model;
        for (let page of Object.values(qp)) {
            const title = page.title;
            const article = model.articles[title];
            if(article) {
                const categories = page.categories;
                if (categories) {
                    categories.forEach(i => model.articleCategories(article, i.title));
                }
            }
        }
    }
}