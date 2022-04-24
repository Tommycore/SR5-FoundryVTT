import {SR} from "../constants";
import {PartsList} from "../parts/PartsList";
import {Helpers} from "../helpers";
import DamageData = Shadowrun.DamageData;
import ArmorData = Shadowrun.ArmorData;
import ValueField = Shadowrun.ValueField;

export class CombatRules {
    static iniOrderCanDoAnotherPass(scores: number[]): boolean {
        for (const score of scores) {
            if (CombatRules.iniScoreCanDoAnotherPass(score)) return true;
        }
        return false;
    }
    /**
     * Check if there is another initiative pass possible with the given score.
     * @param score
     * @return true means another initiative pass is possible
     */
    static iniScoreCanDoAnotherPass(score: number): boolean {
        return CombatRules.reduceIniResultAfterPass(score) > 0;
    }
    /**
     * Reduce the given initiative score according to @PDF SR5#159
     * @param score This given score can't be reduced under zero.
     */
    static reduceIniResultAfterPass(score: number): number {
        return Math.max(score + SR.combat.INI_RESULT_MOD_AFTER_INI_PASS, 0);
    }

    /**
     * Reduce the initiative score according to the current initiative pass @PDF SR5#160.
     * @param score
     * @param pass The current initiative pass. Each combat round starts at the initiative pass of 1.
     */
    static reduceIniOnLateSpawn(score: number, pass: number): number {
        // Assure valid score ranges.
        // Shift initiative pass value range from min 1 to min 0 for multiplication.
        pass = Math.max(pass - 1, 0);
        score = Math.max(score, 0);

        // Reduce the new score according to. NOTE: Modifier is negative
        const reducedScore = score + pass * SR.combat.INI_RESULT_MOD_AFTER_INI_PASS;
        return Math.max(reducedScore, 0);
    }

    /**
     * Determine if an attack hits the defender based on their hits.
     *
     * According to combat sequence (SR5#173) part defend.
     *
     * @param attackerHits
     * @param defenderHits
     * @returns true, when the attack hits.
     */
    static attackHits(attackerHits: number, defenderHits: number): boolean {
        return attackerHits > defenderHits;
    }

    /**
     * Determine if an attack grazes the defender.
     *
     * According to combat sequence (SR5#173) part defend.
     *
     * @param attackerHits
     * @param defenderHits
     * @returns true, when the attack grazes.
     */
    static attackGrazes(attackerHits: number, defenderHits: number): boolean {
        return attackerHits === defenderHits;
    }

    /**
     * Determine if an attack misses the defender based on their hits.
     *
     * According to combat sequence (SR5#173) part defend.
     *
     * @param attackerHits
     * @param defenderHits
     * @returns true, when the attack hits.
     */
    static attackMisses(attackerHits: number, defenderHits: number): boolean {
        return CombatRules.attackHits(attackerHits, defenderHits);
    }

    /**
     * Modify Damage according to combat sequence (SR5#173) part defend.
     *
     * @param attackerNetHits The attackers hits, reduced by the defenders hits. Should be a positive number.
     * @param damage Incoming damage to be modified
     * @return A new damage object for modified damage.
     */
    static modifyDamageAfterHit(attackerNetHits: number, damage: DamageData): DamageData {
        const modifiedDamage = foundry.utils.duplicate(damage);

        // netHits should never be below zero...
        if (attackerNetHits <= 0) return damage;

        PartsList.AddUniquePart(modifiedDamage.mod, 'SR5.AttackerNetHits', attackerNetHits);
        modifiedDamage.value = Helpers.calcTotal(modifiedDamage, {min: 0});

        return modifiedDamage;
    }

    /**
     * Modify amor according to combat sequence (SR5#173) part defend.
     *
     * @param armor An armor value to be modified.
     * @param damage The damage containing the armor penetration to be applied.
     * @returns A new armor value for modified armor
     */
    static modifyArmorAfterHit(armor: ValueField, damage: DamageData): ValueField {
        const modifiedArmor = foundry.utils.duplicate(armor);

        // ignore ap without effect
        if (damage.ap.value <= 0) return modifiedArmor;

        console.error('Check if ap is a negative value or positive value during weapon item configuration');
        PartsList.AddUniquePart(modifiedArmor.mod, 'SR5.AP', damage.ap.value);
        modifiedArmor.value = Helpers.calcTotal(modifiedArmor, {min: 0});

        return modifiedArmor;
    }
}