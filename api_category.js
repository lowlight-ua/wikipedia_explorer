// Get categories for anyl articles in transaction.model 
// that doesn't have categories defined yet.

class ApiCall_Categories extends ApiCallBase
{
    constructor(transaction, model) {
        super(transaction, model);
    }

    run() {
        // max 50 per query
        for (let title of Object.entries(this.model.articles)) {
            console.log(title);
        }
    }
}