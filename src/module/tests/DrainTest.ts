import {SuccessTest, SuccessTestData} from "./SuccessTest";
import {SpellCastingTestData} from "./SpellCastingTest";
import {DefaultValues} from "../data/DataDefaults";
import {DrainRules} from "../rules/DrainRules";
import DamageData = Shadowrun.DamageData;
import MinimalActionData = Shadowrun.MinimalActionData;

export interface DrainTestData extends SuccessTestData {
    incomingDrain: DamageData
    modifiedDrain: DamageData

    against: SpellCastingTestData
}


export class DrainTest extends SuccessTest {
    data: DrainTestData

    _prepareData(data, options): any {
        data = super._prepareData(data, options);

        data.incomingDrain = DefaultValues.damageData();
        data.modifiedDrain = DefaultValues.damageData();

        return data;
    }

    static _getDefaultTestAction(): Partial<MinimalActionData> {
        return {
            'attribute2': 'willpower'
        };
    }

    /**
     * This test type can't be extended.
     */
    get canBeExtended() {
        return false;
    }

    get testModifiers() {
        return []
    }

    static async _getDocumentTestAction(item, actor) {
        const documentAction = await super._getDocumentTestAction(item, actor);

        if (!actor.isAwakened) {
            console.error(`Shadowrun 5e | A ${this.name} expected an awakened actor but got this`, actor);
            return documentAction;
        }

        // Get magic school attribute.
        const attribute = actor.data.data.magic.attribute;
        foundry.utils.mergeObject(documentAction, {attribute});

        // Return the school attribute based on actor configuration.
        return documentAction;
    }

    prepareBaseValues() {
        super.prepareBaseValues();
        this.prepareDrain();
    }

    prepareDrain() {
        if (!this.actor) return;

        const drain = this.data.against.drain;
        const force = this.data.against.force;
        const magic = this.actor.getAttribute('magic').value;

        this.data.incomingDrain = DrainRules.calcDrainDamage(drain, force, magic);
        this.data.modifiedDrain = foundry.utils.duplicate(this.data.incomingDrain);
    }

    async processSuccess() {
        DrainRules.modifyDrainDamage(this.data.modifiedDrain, this.hits.value);

        console.error('Incoming', this.data.incomingDrain);
        console.error('Modified', this.data.modifiedDrain);
    }
}