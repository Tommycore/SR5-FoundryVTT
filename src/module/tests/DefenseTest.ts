import {OpposedTest, OpposedTestData} from "./OpposedTest";
import DamageData = Shadowrun.DamageData;
import {DefaultValues} from "../data/DataDefaults";


export interface DefenseTestData extends OpposedTestData {
    // Damage value of the attack
    incomingDamage: DamageData
    // Modified damage value of the attack after this defense (success or failure)
    modifiedDamage: DamageData
}


/**
 * A semi-mostly abstract class to be used by other classes as a common extension interface.
 */
export class DefenseTest extends OpposedTest {
    data: DefenseTestData

    _prepareData(data, options?) {
        data = super._prepareData(data, options);

        const damage = data.against ? data.against.damage : DefaultValues.damageData();

        data.incomingDamage = foundry.utils.duplicate(damage);
        data.modifiedDamage = foundry.utils.duplicate(damage);

        return data;
    }

    get _chatMessageTemplate() {
        return 'systems/shadowrun5e/dist/templates/rolls/defense-test-message.html'
    }

    get successLabel() {
        return 'SR5.AttackDodged';
    }

    get failureLabel() {
        return 'SR5.AttackHits';
    }
}