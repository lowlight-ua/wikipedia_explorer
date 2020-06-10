// Get categories for anyl articles in caller.wikidata 
// that doesn't have categories defined yet.

class ApiCall_Categories extends ApiCall
{
    constructor(caller) {
        super(caller);
    }

    run() {
        const wikidata = this.caller.wikidata;
    }
}