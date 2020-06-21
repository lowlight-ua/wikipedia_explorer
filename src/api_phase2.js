// In this file:
// API calls associated with the second phase of data collection: gather information
// about the categories of articles that were discovered during the first phase.

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

        titlefy(titles, 50, titleString => this.query(titleString));
    }

    query(titles) {
        super.run({
            data: {
                action: 'query',
                titles: titles,
                prop: 'categories|cirrusdoc',
                clshow: '!hidden',
                cllimit: 'max'
            }
        });
    }

    onDone(data) {
        const qp = data.query.pages;
        const model = this.model;
        for (let page of Object.values(qp)) {
            if (page.missing === undefined) {
                const title = page.title;
                const cirrusDoc = page.cirrusdoc[0];
                const article = model.articles[title];
                if(article) {
                    const categories = page.categories;
                    if (categories) {
                        categories.forEach(i => model.articleCategories(article, i.title));
                    }
                    article.openingText = cirrusDoc.source.opening_text;
                }
            }
        }
    }
}