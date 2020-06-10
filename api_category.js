// Get categories for anyl articles in transaction.model 
// that doesn't have categories defined yet.

class ApiCall_Categories extends ApiCall
{
    constructor(transaction) {
        super(transaction);
    }

    run() {
        const model = this.transaction.model;
    }
}