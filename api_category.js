// Get categories for anyl articles in explorer.wikidata 
// that doesn't have categories defined yet.

class ApiCall_Categories extends ApiCall
{
    constructor(explorer) {
        super(explorer);
    }

    run() {
        const wikidata = this.explorer.wikidata;
    }
}