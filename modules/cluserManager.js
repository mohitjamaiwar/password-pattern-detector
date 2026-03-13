// modules/clusterManager.js
// Handles the logic for grouping similar passwords into clusters.

import { comparePasswords } from './similarityEngine.js';

const SIMILARITY_THRESHOLD = 0.75;

/**
 * Finds the appropriate cluster for a new password fingerprint or creates a new one.
 *
 * @param {object} newFingerprint The fingerprint of the new password.
 * @param {string} site The site the new password is for.
 * @param {Array<object>} existingClusters An array of all current password clusters.
 * @returns {{updatedClusters: Array<object>, foundClusterId: string}} The updated list of clusters and the ID of the cluster the password belongs to.
 */
export function findOrCreateCluster(newFingerprint, site, existingClusters) {
    let foundClusterId = null;
    let isDuplicate = false;
    let exactMatches = 0;
    const similarityResults = [];

    // Analyze against all existing clusters to gather comprehensive metrics
    for (const cluster of existingClusters) {
        for (const member of cluster.members) {
            if (member.site === site) {
                // Ignore identical sites so they don't bloat 'exactMatches' and similarity results.
                if (member.fingerprint.hash === newFingerprint.hash) {
                    isDuplicate = true;
                }
                // We still want to be in the same cluster if we match, so we shouldn't continue; 
                // wait, if we are logging into the exact same site, we belong to its cluster anyway.
                if (member.fingerprint.hash === newFingerprint.hash) {
                    foundClusterId = cluster.id;
                }
                continue; 
            }

            if (member.fingerprint.hash === newFingerprint.hash) {
                exactMatches++;
            }

            const comparison = comparePasswords(newFingerprint, member.fingerprint);
            similarityResults.push(comparison);

            if (comparison.similar && comparison.score >= SIMILARITY_THRESHOLD) {
                foundClusterId = cluster.id;
            }
        }
    }

    // Add to the cluster only if it's not a duplicate on the same site
    if (foundClusterId && !isDuplicate) {
        const cluster = existingClusters.find(c => c.id === foundClusterId);
        if (cluster) {
            cluster.members.push({ site, fingerprint: newFingerprint });
        }
    }

    // If no suitable cluster was found, create a new one
    if (!foundClusterId) {
        const newClusterId = `cluster_${Date.now()}`;
        const newCluster = {
            id: newClusterId,
            members: [{ site, fingerprint: newFingerprint }]
        };
        existingClusters.push(newCluster);
        foundClusterId = newClusterId;
    }

    return { updatedClusters: existingClusters, foundClusterId, similarityResults, exactMatches };
}

/**
 * Retrieves all clusters from storage.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of clusters.
 */
export async function getClusters() {
    const result = await chrome.storage.local.get('passwordClusters');
    return result.passwordClusters || [];
}

/**
 * Saves the updated clusters back to storage.
 * @param {Array<object>} clusters The array of clusters to save.
 */
export async function saveClusters(clusters) {
    await chrome.storage.local.set({ passwordClusters: clusters });
}