import { db } from "../lib/db";
import { workspaces, users, agents, groups, groupMembers, threads, messages, memories, skills, routines, integrations, plans, usageSummary } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, encrypt } from "../lib/crypto";
import { DEFAULT_PLANS, DEFAULT_AGENTS, DEFAULT_GROUP, DEFAULT_ROUTINES, DEFAULT_SKILL, DEFAULT_INTEGRATIONS, DEFAULT_MESSAGES } from "../lib/config";

async function seed() {
  console.log("🌱 Seeding SavvyBot database...");

  try {
    // ============================================
    // SEED PLANS
    // ============================================
    console.log("\n📋 Seeding plans...");
    for (const plan of DEFAULT_PLANS) {
      const [existingPlan] = await db
        .select({ id: plans.id })
        .from(plans)
        .where(eq(plans.code, plan.code))
        .limit(1);

      if (!existingPlan) {
        await db.insert(plans).values({
          id: plan.id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          maxAgents: plan.maxAgents,
          maxIntegrations: plan.maxIntegrations,
          monthlyTurns: plan.monthlyTurns,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          features: plan.features,
          isActive: plan.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ✅ Created plan: ${plan.name}`);
      } else {
        console.log(`  ⏭️  Skipped plan: ${plan.name} (already exists)`);
      }
    }

    // ============================================
    // SEED WORKSPACE
    // ============================================
    console.log("\n🏢 Seeding workspace...");
    const workspaceSlug = "demo-workspace";
    const encryptionKey = process.env.ENCRYPTION_KEY || "test_key_32_bytes_long_123456";
    
    const [existingWorkspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, workspaceSlug))
      .limit(1);

    let workspaceId: string;
    
    if (!existingWorkspace) {
      const [workspace] = await db
        .insert(workspaces)
        .values({
          id: workspaceSlug,
          name: "Demo Workspace",
          slug: workspaceSlug,
          plan: "free",
          timezone: "Europe/Madrid",
          theme: "light",
          language: "es",
          billingEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      workspaceId = workspace.id;
      console.log(`  ✅ Created workspace: ${workspace.name}`);
    } else {
      workspaceId = existingWorkspace.id;
      console.log(`  ⏭️  Using existing workspace: ${workspaceId}`);
    }

    // ============================================
    // SEED USER
    // ============================================
    console.log("\n👤 Seeding user...");
    const userEmail = "demo@savvybot.local";
    const passwordHash = await hashPassword("demo1234");
    
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    let userId: string;
    
    if (!existingUser) {
      const [user] = await db
        .insert(users)
        .values({
          id: "demo-user-id",
          email: userEmail,
          name: "Demo User",
          passwordHash,
          workspaceId,
          role: "owner",
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      userId = user.id;
      console.log(`  ✅ Created user: ${user.name} (${user.email})`);
    } else {
      userId = existingUser.id;
      console.log(`  ⏭️  Using existing user: ${userId}`);
    }

    // ============================================
    // SEED AGENTS
    // ============================================
    console.log("\n🤖 Seeding agents...");
    for (const agentData of DEFAULT_AGENTS) {
      const [existingAgent] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(and(
          eq(agents.name, agentData.name),
          eq(agents.workspaceId, workspaceId)
        ))
        .limit(1);

      if (!existingAgent) {
        const [agent] = await db
          .insert(agents)
          .values({
            id: `agent-${agentData.name.toLowerCase().replace(/\s+/g, "-")}-id`,
            workspaceId,
            name: agentData.name,
            emoji: agentData.emoji,
            color: agentData.color,
            role: agentData.role,
            personality: agentData.personality,
            instructions: agentData.instructions,
            autonomy: agentData.autonomy,
            modelName: agentData.modelName,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        console.log(`  ✅ Created agent: ${agent.name}`);
      } else {
        console.log(`  ⏭️  Skipped agent: ${agentData.name} (already exists)`);
      }
    }

    // Get agent IDs for later use
    const [vectorAgent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(
        eq(agents.name, "Vector 🧭"),
        eq(agents.workspaceId, workspaceId)
      ))
      .limit(1);

    const [scoutAgent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(
        eq(agents.name, "Scout 🔎"),
        eq(agents.workspaceId, workspaceId)
      ))
      .limit(1);

    const [faroAgent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(
        eq(agents.name, "Faro 📬"),
        eq(agents.workspaceId, workspaceId)
      ))
      .limit(1);

    // ============================================
    // SEED GROUP
    // ============================================
    console.log("\n👥 Seeding group...");
    const [existingGroup] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.name, DEFAULT_GROUP.name))
      .limit(1);

    let groupId: string;
    
    if (!existingGroup) {
      const [group] = await db
        .insert(groups)
        .values({
          id: "group-equipo-amanecer-id",
          workspaceId,
          name: DEFAULT_GROUP.name,
          emoji: DEFAULT_GROUP.emoji,
          color: DEFAULT_GROUP.color,
          mode: DEFAULT_GROUP.mode,
          description: DEFAULT_GROUP.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      groupId = group.id;
      console.log(`  ✅ Created group: ${group.name}`);
    } else {
      groupId = existingGroup.id;
      console.log(`  ⏭️  Using existing group: ${groupId}`);
    }

    // ============================================
    // SEED GROUP MEMBERS
    // ============================================
    console.log("\n👥 Seeding group members...");
    if (vectorAgent && scoutAgent && faroAgent) {
      // Check if members already exist
      const existingMembers = await db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

      if (existingMembers.length === 0) {
        await db.insert(groupMembers).values([
          {
            id: "group-member-vector-id",
            groupId,
            agentId: vectorAgent.id,
            muted: false,
            joinedAt: new Date(),
          },
          {
            id: "group-member-scout-id",
            groupId,
            agentId: scoutAgent.id,
            muted: false,
            joinedAt: new Date(),
          },
          {
            id: "group-member-faro-id",
            groupId,
            agentId: faroAgent.id,
            muted: false,
            joinedAt: new Date(),
          },
        ]);
        
        console.log(`  ✅ Added 3 agents to group: ${DEFAULT_GROUP.name}`);
      } else {
        console.log(`  ⏭️  Group members already exist`);
      }
    }

    // ============================================
    // SEED THREADS
    // ============================================
    console.log("\n💬 Seeding threads...");
    
    // Thread 1: Chat with Vector
    const [existingThread1] = await db
      .select({ id: threads.id })
      .from(threads)
      .where(and(
        eq(threads.title, "Organizar semana"),
        eq(threads.workspaceId, workspaceId)
      ))
      .limit(1);

    let thread1Id: string;
    
    if (!existingThread1 && vectorAgent) {
      const [thread] = await db
        .insert(threads)
        .values({
          id: "thread-organizar-semana-id",
          workspaceId,
          title: "Organizar semana",
          agentId: vectorAgent.id,
          archived: false,
          pinned: false,
          lastMessageAt: new Date(),
          unreadCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      thread1Id = thread.id;
      console.log(`  ✅ Created thread: ${thread.title}`);
    } else {
      thread1Id = existingThread1?.id || "";
      console.log(`  ⏭️  Using existing thread: Organizar semana`);
    }

    // Thread 2: Group chat
    const [existingThread2] = await db
      .select({ id: threads.id })
      .from(threads)
      .where(and(
        eq(threads.title, "Equipo Amanecer"),
        eq(threads.workspaceId, workspaceId)
      ))
      .limit(1);

    let thread2Id: string;
    
    if (!existingThread2) {
      const [thread] = await db
        .insert(threads)
        .values({
          id: "thread-equipo-amanecer-id",
          workspaceId,
          title: "Equipo Amanecer",
          groupId,
          archived: false,
          pinned: false,
          lastMessageAt: new Date(),
          unreadCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      thread2Id = thread.id;
      console.log(`  ✅ Created thread: ${thread.title}`);
    } else {
      thread2Id = existingThread2?.id || "";
      console.log(`  ⏭️  Using existing thread: Equipo Amanecer`);
    }

    // ============================================
    // SEED MESSAGES
    // ============================================
    console.log("\n📝 Seeding messages...");
    
    if (thread1Id && vectorAgent) {
      const existingMessages = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.threadId, thread1Id));

      if (existingMessages.length === 0) {
        // Add messages to thread 1
        for (const msg of DEFAULT_MESSAGES) {
          await db.insert(messages).values({
            id: `msg-${thread1Id}-${DEFAULT_MESSAGES.indexOf(msg)}-id`,
            threadId: thread1Id,
            authorType: msg.authorType,
            authorId: msg.authorType === "user" ? userId : vectorAgent.id,
            agentId: msg.authorType === "agent" ? vectorAgent.id : undefined,
            content: msg.content,
            modelUsed: msg.authorType === "agent" ? msg.modelUsed : undefined,
            createdAt: new Date(Date.now() - (DEFAULT_MESSAGES.length - DEFAULT_MESSAGES.indexOf(msg)) * 60000),
            updatedAt: new Date(Date.now() - (DEFAULT_MESSAGES.length - DEFAULT_MESSAGES.indexOf(msg)) * 60000),
          });
        }
        
        console.log(`  ✅ Added ${DEFAULT_MESSAGES.length} messages to thread: Organizar semana`);
      } else {
        console.log(`  ⏭️  Messages already exist in thread: Organizar semana`);
      }
    }

    // ============================================
    // SEED SKILL
    // ============================================
    console.log("\n🎯 Seeding skills...");
    if (vectorAgent) {
      const [existingSkill] = await db
        .select({ id: skills.id })
        .from(skills)
        .where(and(
          eq(skills.name, DEFAULT_SKILL.name),
          eq(skills.agentId, vectorAgent.id)
        ))
        .limit(1);

      if (!existingSkill) {
        await db.insert(skills).values({
          id: "skill-resumir-conversacion-id",
          agentId: vectorAgent.id,
          name: DEFAULT_SKILL.name,
          goal: DEFAULT_SKILL.goal,
          steps: DEFAULT_SKILL.steps,
          inputs: DEFAULT_SKILL.inputs,
          outputs: DEFAULT_SKILL.outputs,
          knownErrors: DEFAULT_SKILL.knownErrors,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log(`  ✅ Created skill: ${DEFAULT_SKILL.name}`);
      } else {
        console.log(`  ⏭️  Skill already exists: ${DEFAULT_SKILL.name}`);
      }
    }

    // ============================================
    // SEED ROUTINES
    // ============================================
    console.log("\n⏰ Seeding routines...");
    for (const routineData of DEFAULT_ROUTINES) {
      const [existingRoutine] = await db
        .select({ id: routines.id })
        .from(routines)
        .where(and(
          eq(routines.name, routineData.name),
          eq(routines.workspaceId, workspaceId)
        ))
        .limit(1);

      if (!existingRoutine && vectorAgent) {
        await db.insert(routines).values({
          id: `routine-${routineData.name.toLowerCase().replace(/\s+/g, "-")}-id`,
          workspaceId,
          name: routineData.name,
          description: routineData.description,
          targetType: routineData.targetType,
          targetId: vectorAgent.id,
          triggerType: routineData.triggerType,
          triggerValue: routineData.triggerValue,
          action: routineData.action,
          autonomy: routineData.autonomy,
          enabled: routineData.enabled,
          consecutiveFailures: 0,
          quietHoursEnabled: routineData.quietHoursEnabled,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log(`  ✅ Created routine: ${routineData.name}`);
      } else {
        console.log(`  ⏭️  Routine already exists: ${routineData.name}`);
      }
    }

    // ============================================
    // SEED INTEGRATIONS
    // ============================================
    console.log("\n🔌 Seeding integrations...");
    for (const integrationData of DEFAULT_INTEGRATIONS) {
      const [existingIntegration] = await db
        .select({ id: integrations.id })
        .from(integrations)
        .where(and(
          eq(integrations.providerName, integrationData.providerName),
          eq(integrations.workspaceId, workspaceId)
        ))
        .limit(1);

      if (!existingIntegration) {
        // Encrypt config
        const configCiphertext = encrypt(integrationData.config, encryptionKey);
        
        await db.insert(integrations).values({
          id: `integration-${integrationData.providerName}-id`,
          workspaceId,
          kind: integrationData.kind,
          providerName: integrationData.providerName,
          displayName: integrationData.displayName,
          description: integrationData.description,
          configCiphertext,
          status: integrationData.status,
          lastCheckedAt: new Date(),
          metadata: integrationData.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log(`  ✅ Created integration: ${integrationData.displayName}`);
      } else {
        console.log(`  ⏭️  Integration already exists: ${integrationData.displayName}`);
      }
    }

    // ============================================
    // SEED MEMORIES
    // ============================================
    console.log("\n🧠 Seeding memories...");
    const existingMemories = await db
      .select({ id: memories.id })
      .from(memories)
      .where(eq(memories.workspaceId, workspaceId));

    if (existingMemories.length === 0) {
      await db.insert(memories).values([
        {
          id: "memory-welcome-id",
          workspaceId,
          scope: "global",
          type: "instruction",
          text: "Bienvenido a SavvyBot. Esta es tu plataforma de agentes de IA. Puedes crear, personalizar y agrupar agentes para automatizar tareas.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "memory-tips-id",
          workspaceId,
          scope: "global",
          type: "note",
          text: "Consejo: Usa el modo relevo en grupos para que los agentes trabajen de forma coordinada.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      
      console.log(`  ✅ Added 2 global memories`);
    } else {
      console.log(`  ⏭️  Memories already exist`);
    }

    // ============================================
    // SEED USAGE SUMMARY
    // ============================================
    console.log("\n📊 Seeding usage summary...");
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const [existingUsage] = await db
      .select({ id: usageSummary.id })
      .from(usageSummary)
      .where(and(
        eq(usageSummary.workspaceId, workspaceId),
        eq(usageSummary.month, currentMonth)
      ))
      .limit(1);

    if (!existingUsage) {
      await db.insert(usageSummary).values({
        id: `usage-${workspaceId}-${currentMonth}-id`,
        workspaceId,
        month: currentMonth,
        turnsUsed: 10,
        tokensUsed: 5000,
        toolsUsed: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log(`  ✅ Created usage summary for ${currentMonth}`);
    } else {
      console.log(`  ⏭️  Usage summary already exists for ${currentMonth}`);
    }

    // ============================================
    // COMPLETED
    // ============================================
    console.log("\n" + "=".repeat(50));
    console.log("✨ Database seeding completed!");
    console.log("=".repeat(50));
    console.log("\nDemo credentials:");
    console.log(`  Email: ${userEmail}`);
    console.log(`  Password: demo1234`);
    console.log("\nAccess the demo at: http://localhost:3000");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Import and, eq, sql from drizzle-orm
import { and, eq, sql } from "drizzle-orm";

// Run the seed
seed();
