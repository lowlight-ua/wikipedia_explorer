// Get categories for anyl articles in transaction.wikidata 
// that doesn't have categories defined yet.

class ApiCall_Categories extends ApiCall
{
    constructor(transaction) {
        super(transaction);
    }

    run() {
        const wikidata = this.transaction.wikidata;
    }
}