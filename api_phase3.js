// In this file:
// API calls that allow to generate a limited category graph, allowing to link the 
// discovered categories with themselves and parents/descendants of several generations.

//-----------------------------------------------------------------------------

class ApiCall_CategoryParents extends ApiCallBase
{
    generation; 

    constructor(transaction, model, generation) {
        super(transaction, model);
        this.generation = generation;
    }

    run() {
        // max 50 per query
        let titles = [];
        
        for (let [title, category] of Object.entries(this.model.categories)) {
            if(category.generation == this.generation) {
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
                prop: 'categories',
                clshow: '!hidden',
                cllimit: 'max'
            }
        });
    }

    onDone(data) {
        
    }
}




