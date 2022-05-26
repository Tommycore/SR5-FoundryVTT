import {
    SuccessTest,
    SuccessTestData,
    TestOptions,
    SuccessTestValues,
    TestDocuments,
    TestData
} from "./SuccessTest";
import {DefaultValues} from "../data/DataDefaults";
import {PartsList} from "../parts/PartsList";
import {SR5} from "../config";


export interface OpposedTestValues extends SuccessTestValues {
}

export interface OpposedTestData extends
    TestData,
    // Remove unnecessary data points.
    Omit<SuccessTestData, 'opposed'>,
    Omit<SuccessTestData, 'targetActorsUuid'> {

    // The message id of the opposed test.
    previousMessageId: string
    values: OpposedTestValues
    against: SuccessTestData
}
/**
 * An opposed test results from a normal success test as an opposed action.
 */
export class OpposedTest extends SuccessTest {
    public data: OpposedTestData;
    public against: SuccessTest

    constructor(data, documents?: TestDocuments, options?: TestOptions) {
        super(data, documents, options);

        this.against = new SuccessTest(this.data.against);
    }

    // TODO: This could also be done with _prepareTypeData for only type specific fields.
    _prepareData(data, options?): any {
        data = super._prepareData(data, options);

        delete data.opposed;
        delete data.targetActorsUuid;

        return data;
    }

    async populateDocuments() {
        await super.populateDocuments();

        await this.against.populateDocuments();
    }

    static async getMessageActionTestData(againstData: SuccessTestData, actor, previousMessageId: string): Promise<OpposedTestData | undefined> {
        if (!againstData.opposed) {
            console.error(`Shadowrun 5e | Supplied test data doesn't contain an opposed action`, againstData);
            return;
        }
        // @ts-ignore // TODO: Typing here get's confused between boolean when it should be string.
        if (againstData.opposed.type !== '') {
            console.error(`Shadowrun 5e | Supplied test defines a opposed test type ${againstData.opposed.type} but only type '' is supported`);
            return;
        }
        if (!actor) {
            console.error(`Shadowrun 5e | Can't resolve opposed test values due to missing actor`);
            return;
        }

        // Prepare testing data.
        const data = {
            // While not visible, when there is a description set, use it.
            title: againstData.opposed.description || undefined,

            previousMessageId,

            pool: DefaultValues.valueData({label: 'SR5.DicePool'}),
            limit: DefaultValues.valueData({label: 'SR5.Limit'}),
            threshold: DefaultValues.valueData({label: 'SR5.Threshold'}),
            values: {},

            against: againstData
        }

        // An opposing test will oppose net hits of the opposed test.
        // Register these as a threshold, which will trigger success/failure status
        // and calculate netHits accordingly.
        data.threshold.base = againstData.values.netHits.value;

        // Don't alter original opposed data in place.
        const opposed = foundry.utils.duplicate(againstData.opposed);

        // Use default values, where defined.
        const defaultAction = SR5.testDefaultAction[this.name];
        opposed.skill = opposed.skill || defaultAction.skill;
        opposed.attribute = opposed.attribute || defaultAction.attribute;
        opposed.attribute2 = opposed.attribute2 || defaultAction.attribute2;
        opposed.mod = opposed.mod || defaultAction.mod;

        // TODO: Check if this approach can be replaced by creating a parial action and using getMessageActionTestData

        // Get all value sources to be used for this test.
        if (opposed.skill && opposed.attribute) {
            // TODO: Handle skill testing rules.
            const skill = actor.getSkill(opposed.skill);
            if (skill) data.pool.mod = PartsList.AddUniquePart(data.pool.mod, skill.label, skill.value, false);

            const attribute = actor.getAttribute(opposed.attribute);
            if (attribute) data.pool.mod = PartsList.AddUniquePart(data.pool.mod, attribute.label, attribute.value, false);
        }

        if (!opposed.skill && opposed.attribute) {
            const attribute = actor.getAttribute(opposed.attribute);
            if (attribute) data.pool.mod = PartsList.AddUniquePart(data.pool.mod, attribute.label, attribute.value, false);
        }
        if (!opposed.skill && opposed.attribute2) {
            const attribute = actor.getAttribute(opposed.attribute2);
            if (attribute) data.pool.mod = PartsList.AddUniquePart(data.pool.mod, attribute.label, attribute.value, false);
        }
        if (opposed.mod) {
            data.pool.base = Number(opposed.mod);
        }

        return data as OpposedTestData;
    }

    /**
     * Overwrite SuccessTest#opposed behavior as an OpposedTest can't have another opposed test.
     */
    get opposed() {
        return false;
    }

    static chatMessageListeners(message: ChatMessage, html, data) {
        html.find('.opposed-action').on('click', (event) => OpposedTest._castOpposedAction(event, html));
    }
}