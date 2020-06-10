// In this file:
// API calls associated with the second phase of data collection: gather information
// about all the articles and categories that were discovered during the first phase.

// ----------------------------------------------------------------------------

// Get categories for any articles in `Model`
// that doesn't have categories defined yet.

class ApiCall_Categories extends ApiCallBase
{
    constructor(transaction, model) {
        super(transaction, model);
    }

    run() {
        // max 50 per query
        let titles = [];
        
        for (let [title, article] of Object.entries(this.model.articles)) {
            if(article.categories.length == 0) {
                titles.push(title);
            }
        }

        let titleString = "";
        let counter = 0;
        for (let i = 0; i < titles.length; i++) {
            const title = titles[i];
            titleString += (counter ? "|" : "") + title;
            counter++;
            if(counter == 50) {
                this.query(titleString);
                titleString = "";
                counter = 0;
            }
        }
        this.query(titleString);
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