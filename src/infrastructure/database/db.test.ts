import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from './db';
import 'fake-indexeddb/auto';

describe('Database (Dexie)', () => {
  beforeEach(async () => {
    // Reset database state before each test
  });

  afterEach(async () => {
    // Close the connection
    db.close();
  });

  it('should create database instance correctly', () => {
    expect(db).toBeDefined();
    expect(db.name).toBe('SamtechCRM_Uninitialized');
  });

  it('should open and close the database successfully', async () => {
    expect(db.isOpen()).toBe(false);
    await db.open();
    expect(db.isOpen()).toBe(true);
    db.close();
    expect(db.isOpen()).toBe(false);
  });
});
